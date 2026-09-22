import { env } from '@config/env';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import { logger } from '@config/logger';

const MODEL_PREFERENCE = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
] as const;

const REQUEST_TIMEOUT_MS = 60_000;
const MAX_RETRIES_PER_MODEL = 2;

type GeminiErrorKind =
  | 'auth'
  | 'rate_limit'
  | 'transient'
  | 'invalid_request'
  | 'model_not_found'
  | 'unknown';

interface GeminiRequestError extends Error {
  status?: number;
  errorKind?: GeminiErrorKind;
  errorCode?: string;
  retryable?: boolean;
}

interface GeminiApiErrorResponse {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: unknown[];
  };
}

interface GenerateJsonOptions {
  userId?: string;
  analysisId?: string;
  promptType?: string;
}

function createGeminiError(
  message: string,
  status?: number,
  errorKind: GeminiErrorKind = 'unknown',
  errorCode?: string,
): GeminiRequestError {
  const error = new Error(message) as GeminiRequestError;

  error.status = status;
  error.errorKind = errorKind;
  error.errorCode = errorCode;

  error.retryable =
    errorKind === 'transient' || errorKind === 'rate_limit';

  return error;
}

function classifyGeminiError(
  status?: number,
  errorCode?: string,
): GeminiErrorKind {
  if (status === 401 || status === 403) {
    return 'auth';
  }

  if (status === 429) {
    return 'rate_limit';
  }

  if (status === 400) {
    return 'invalid_request';
  }

  if (status === 404) {
    return 'model_not_found';
  }

  if (
    status === 408 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    errorCode === 'UNAVAILABLE' ||
    errorCode === 'DEADLINE_EXCEEDED'
  ) {
    return 'transient';
  }

  return 'unknown';
}

function getRetryDelayMs(retryNumber: number): number {
  // Exponential backoff:
  // retry 1 -> ~2 seconds
  // retry 2 -> ~4 seconds
  //
  // Add jitter so repeated requests do not all retry simultaneously.
  const baseDelay = Math.min(
    2000 * Math.pow(2, retryNumber - 1),
    8000,
  );

  const jitter = Math.floor(Math.random() * 1000);

  return baseDelay + jitter;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey(): string {
  const apiKey = env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new ApiError(
      503,
      'GEMINI_API_KEY is not configured on this server',
      ErrorCodes.GEMINI_NOT_CONFIGURED,
    );
  }

  return apiKey;
}

async function requestGemini(
  model: string,
  prompt: string,
  userId?: string,
  analysisId?: string,
  promptType: string = 'career-report',
): Promise<string> {
  const apiKey = getApiKey();

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(model)}:generateContent`;

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const startedAt = Date.now();

  try {
    logger.info('[GEMINI] HTTP request started', {
      model,
      promptLength: prompt.length,
      promptType,
      userId,
      analysisId,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: 8192,
        },
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;

    const rawBody = await response.text();

    if (!response.ok) {
      let parsedBody: GeminiApiErrorResponse = {};

      try {
        parsedBody = JSON.parse(rawBody) as GeminiApiErrorResponse;
      } catch {
        // Keep parsedBody empty if Google did not return JSON.
      }

      const googleError = parsedBody.error;

      const status = response.status;

      const errorCode =
        googleError?.status ||
        (typeof googleError?.code === 'number'
          ? String(googleError.code)
          : undefined);

      const errorMessage =
        googleError?.message ||
        rawBody ||
        `Gemini request failed with HTTP ${status}`;

      const errorKind = classifyGeminiError(status, errorCode);

      const error = createGeminiError(
        errorMessage,
        status,
        errorKind,
        errorCode,
      );

      logger.error('[GEMINI] HTTP request failed', {
        model,
        status,
        errorKind,
        errorCode,
        errorMessage,
        latencyMs,
        userId,
        analysisId,
      });

      throw error;
    }

    logger.info('[GEMINI] HTTP response received', {
      model,
      status: response.status,
      latencyMs,
      responseLength: rawBody.length,
      userId,
      analysisId,
    });

    let data: any;

    try {
      data = JSON.parse(rawBody);
    } catch {
      throw createGeminiError(
        'Gemini returned a non-JSON HTTP response',
        response.status,
        'unknown',
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part?.text || '')
        .join('')
        .trim() || '';

    if (!text) {
      const finishReason =
        data?.candidates?.[0]?.finishReason;

      throw createGeminiError(
        finishReason
          ? `Gemini returned an empty response. Finish reason: ${finishReason}`
          : 'Gemini returned an empty response',
        response.status,
        'unknown',
      );
    }

    return text;
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name?: string }).name === 'AbortError'
    ) {
      const timeoutError = createGeminiError(
        `Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms`,
        408,
        'transient',
        'TIMEOUT',
      );

      logger.error('[GEMINI] Request timeout', {
        model,
        timeoutMs: REQUEST_TIMEOUT_MS,
        userId,
        analysisId,
      });

      throw timeoutError;
    }

    if (err instanceof Error && 'errorKind' in err) {
      throw err;
    }

    const originalMessage =
      err instanceof Error ? err.message : String(err);

    const requestError = createGeminiError(
      originalMessage,
      undefined,
      'unknown',
    );

    logger.error('[GEMINI] Request exception', {
      model,
      errorMessage: originalMessage,
      latencyMs: Date.now() - startedAt,
      userId,
      analysisId,
    });

    throw requestError;
  } finally {
    clearTimeout(timeout);
  }
}

async function generateWithModel(
  model: string,
  prompt: string,
  userId?: string,
  analysisId?: string,
  promptType: string = 'career-report',
): Promise<string> {
  let lastError: GeminiRequestError | undefined;

  for (
    let retryNumber = 0;
    retryNumber <= MAX_RETRIES_PER_MODEL;
    retryNumber += 1
  ) {
    try {
      return await requestGemini(
        model,
        prompt,
        userId,
        analysisId,
        promptType,
      );
    } catch (err) {
      const error =
        err instanceof Error
          ? (err as GeminiRequestError)
          : createGeminiError(String(err));

      lastError = error;

      const isRetryable =
        error.retryable === true ||
        error.errorKind === 'transient' ||
        error.errorKind === 'rate_limit';

      const hasRetriesLeft =
        retryNumber < MAX_RETRIES_PER_MODEL;

      if (!isRetryable || !hasRetriesLeft) {
        throw error;
      }

      const delayMs = getRetryDelayMs(
        retryNumber + 1,
      );

      logger.warn(
        '[GEMINI] Retrying after transient failure',
        {
          model,
          retryNumber: retryNumber + 1,
          maxRetries: MAX_RETRIES_PER_MODEL,
          delayMs,
          errorKind: error.errorKind,
          errorStatus: error.status,
          errorCode: error.errorCode,
          userId,
          analysisId,
        },
      );

      await sleep(delayMs);
    }
  }

  throw (
    lastError ||
    createGeminiError('Gemini generation failed')
  );
}

/**
 * Generates JSON-only content from Gemini.
 *
 * Strategy:
 *
 * Model 1
 *   -> retry with exponential backoff + jitter
 *   -> retry again
 *
 * Model 2
 *   -> retry with exponential backoff + jitter
 *   -> retry again
 *
 * Model 3
 *   -> retry with exponential backoff + jitter
 *   -> retry again
 *
 * This is especially important for temporary 503 UNAVAILABLE
 * responses caused by Gemini service capacity/high demand.
 */
export async function generateJson(
  prompt: string,
  options: GenerateJsonOptions = {},
): Promise<string> {
  const {
    userId,
    analysisId,
    promptType = 'career-report',
  } = options;

  logger.info('[GEMINI] Starting generation', {
    model: MODEL_PREFERENCE[0],
    fallbackModel: MODEL_PREFERENCE[1],
    promptLength: prompt.length,
    userId,
    analysisId,
    promptType,
  });

  const errors: Array<{
    model: string;
    errorKind?: GeminiErrorKind;
    status?: number;
    message: string;
  }> = [];

  for (
    let modelIndex = 0;
    modelIndex < MODEL_PREFERENCE.length;
    modelIndex += 1
  ) {
    const model = MODEL_PREFERENCE[modelIndex];

    try {
      const result = await generateWithModel(
        model,
        prompt,
        userId,
        analysisId,
        promptType,
      );

      logger.info('[GEMINI] Generation successful', {
        model,
        promptLength: prompt.length,
        responseLength: result.length,
        userId,
        analysisId,
        promptType,
      });

      return result;
    } catch (err) {
      const error =
        err instanceof Error
          ? (err as GeminiRequestError)
          : createGeminiError(String(err));

      errors.push({
        model,
        errorKind: error.errorKind,
        status: error.status,
        message: error.message,
      });

      const nextModel =
        MODEL_PREFERENCE[modelIndex + 1];

      if (!nextModel) {
        break;
      }

      // Authentication and invalid-request errors will not be fixed
      // by changing models, so fail immediately.
      if (
        error.errorKind === 'auth' ||
        error.errorKind === 'invalid_request'
      ) {
        throw new ApiError(
          error.status || 502,
          `Gemini API request failed: ${error.message}`,
          ErrorCodes.AI_GENERATION_FAILED,
        );
      }

      logger.warn(
        '[GEMINI] Switching to fallback model',
        {
          failedModel: model,
          fallbackModel: nextModel,
          errorKind: error.errorKind,
          errorStatus: error.status,
          errorCode: error.errorCode,
          userId,
          analysisId,
          promptType,
        },
      );
    }
  }

  const lastError =
    errors[errors.length - 1];

  logger.error(
    '[GEMINI] All configured models failed',
    {
      attemptedModels: errors.map(
        (item) => item.model,
      ),
      errors: errors.map((item) => ({
        model: item.model,
        errorKind: item.errorKind,
        status: item.status,
        message: item.message,
      })),
      userId,
      analysisId,
      promptType,
    },
  );

  if (lastError?.errorKind === 'rate_limit') {
    throw new ApiError(
      429,
      'Gemini API rate limit reached. Please try again shortly.',
      ErrorCodes.AI_GENERATION_FAILED,
    );
  }

  if (lastError?.errorKind === 'transient') {
    throw new ApiError(
      503,
      'Gemini is temporarily unavailable due to high demand. Please try again shortly.',
      ErrorCodes.AI_GENERATION_FAILED,
    );
  }

  throw new ApiError(
    lastError?.status || 502,
    lastError?.message ||
      'Failed to generate response from Gemini',
    ErrorCodes.AI_GENERATION_FAILED,
  );
}

/**
 * Lightweight connectivity check.
 *
 * This does not expose the API key and can be used by a diagnostic
 * route to verify that the Gemini API is reachable.
 */
export async function validateGeminiConnectivity(): Promise<{
  configured: boolean;
  model: string;
}> {
  const apiKey = env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return {
      configured: false,
      model: env.GEMINI_MODEL,
    };
  }

  return {
    configured: true,
    model: env.GEMINI_MODEL,
  };
}