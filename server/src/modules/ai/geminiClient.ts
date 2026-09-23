import { env } from '@config/env';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import { logger } from '@config/logger';

const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
] as const;

/*
 * Gemini should normally respond well below this time.
 * A shorter timeout prevents long-running requests from occupying
 * server resources unnecessarily.
 */
const REQUEST_TIMEOUT_MS = 45_000;

/*
 * Retries are ONLY used for genuinely transient failures such as
 * 503/504/timeouts.
 *
 * Rate-limit/quota errors (429) are never retried.
 */
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

/**
 * Build the model preference list.
 *
 * GEMINI_MODEL is always attempted first when configured.
 * Fallback models are used only when switching models may reasonably help.
 */
function getModelPreference(): string[] {
  const configuredModel = env.GEMINI_MODEL?.trim();

  const models = [
    configuredModel,
    ...FALLBACK_MODELS,
  ].filter(Boolean) as string[];

  return [...new Set(models)];
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

  /*
   * IMPORTANT:
   * 429 errors are deliberately NOT retryable.
   *
   * Retrying a free-tier quota error wastes requests and does not
   * increase the available project quota.
   */
  error.retryable = errorKind === 'transient';

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

        /*
         * Keep the response strictly JSON.
         *
         * 6144 is sufficient for the structured career report while
         * preventing unnecessarily large model responses.
         */
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
          maxOutputTokens: 6144,
        },
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;
    const rawBody = await response.text();

    if (!response.ok) {
      let parsedBody: GeminiApiErrorResponse = {};

      try {
        parsedBody =
          JSON.parse(rawBody) as GeminiApiErrorResponse;
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

      const errorKind = classifyGeminiError(
        status,
        errorCode,
      );

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
        ?.map(
          (part: { text?: string }) =>
            part?.text || '',
        )
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

    if (
      err instanceof Error &&
      'errorKind' in err
    ) {
      throw err;
    }

    const originalMessage =
      err instanceof Error
        ? err.message
        : String(err);

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

      /*
       * 429 means project quota/rate limit.
       * Do not retry and do not consume additional requests.
       */
      if (error.errorKind === 'rate_limit') {
        logger.warn(
          '[GEMINI] Rate limit reached — stopping retries',
          {
            model,
            errorStatus: error.status,
            errorCode: error.errorCode,
            userId,
            analysisId,
            promptType,
          },
        );

        throw error;
      }

      const isRetryable =
        error.errorKind === 'transient' &&
        error.retryable === true;

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
 * Model strategy:
 * 1. Configured GEMINI_MODEL
 * 2. Fallback models only when switching may help
 *
 * 429:
 * - stop immediately
 * - do not retry
 * - do not switch models
 *
 * Transient errors:
 * - retry the same model
 * - then try the next model
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

  const modelPreference = getModelPreference();

  logger.info('[GEMINI] Starting generation', {
    model: modelPreference[0],
    fallbackModel: modelPreference[1],
    configuredModels: modelPreference,
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
    modelIndex < modelPreference.length;
    modelIndex += 1
  ) {
    const model = modelPreference[modelIndex];

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

      /*
       * CRITICAL:
       *
       * A 429 is a project-level quota/rate-limit problem.
       * Trying another model will not solve the quota issue.
       */
      if (error.errorKind === 'rate_limit') {
        logger.warn(
          '[GEMINI] Project quota/rate limit reached — no fallback model attempted',
          {
            failedModel: model,
            errorStatus: error.status,
            errorCode: error.errorCode,
            userId,
            analysisId,
            promptType,
          },
        );

        throw new ApiError(
          429,
          'Gemini API free-tier quota or rate limit has been reached. No additional Gemini requests were attempted. Please try again after the quota window resets.',
          ErrorCodes.AI_GENERATION_FAILED,
        );
      }

      /*
       * Authentication and invalid-request errors will not be fixed
       * by changing models.
       */
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

      const nextModel =
        modelPreference[modelIndex + 1];

      if (!nextModel) {
        break;
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
 * This only verifies whether the API key is configured.
 * It does not make a Gemini generation request.
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