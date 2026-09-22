import { Types } from 'mongoose';
import { generateJson } from './geminiClient';
import { buildCareerAnalysisPrompt } from './prompts/careerAnalysisPrompt';
import { geminiCareerReportSchema, GeminiCareerReport } from './geminiCareerReport.schema';
import { AIInsight, IAIInsight } from './aiInsight.model';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import { logger } from '@config/logger';

function extractJsonBlock(text: string): string {
  // 1. Try fenced code block (```json ... ```)
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    const inner = fenced[1].trim();
    if (inner.startsWith('{') || inner.startsWith('[')) return inner;
  }
  // 2. Try to extract the outermost JSON object
  const jsonStart = text.indexOf('{');
  const jsonEnd   = text.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd > jsonStart) {
    return text.slice(jsonStart, jsonEnd + 1);
  }
  // 3. Return trimmed text and let JSON.parse handle the error
  return text.trim();
}

interface CallOptions {
  userId: string;
  analysisId: string;
}

async function callGeminiAndValidate(prompt: string, opts: CallOptions): Promise<GeminiCareerReport> {
  logger.info('[AI_SERVICE] Calling Gemini', {
    userId: opts.userId,
    analysisId: opts.analysisId,
    promptLength: prompt.length,
  });

  const rawResponse = await generateJson(prompt, {
    userId: opts.userId,
    analysisId: opts.analysisId,
    promptType: 'career-report',
  });

  logger.info('[AI_SERVICE] Gemini responded, parsing JSON', {
    userId: opts.userId,
    analysisId: opts.analysisId,
    responseLength: rawResponse.length,
  });

  // Parse JSON — try extraction first to handle any stray markdown
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJsonBlock(rawResponse));
  } catch (parseErr) {
    logger.warn('[AI_SERVICE] First JSON parse failed, retrying with raw', {
      userId: opts.userId,
      analysisId: opts.analysisId,
      error: (parseErr as Error).message,
      responsePreview: rawResponse.slice(0, 200),
    });

    // Retry: ask Gemini to return ONLY JSON
    const retryPrompt = `${prompt}\n\nCRITICAL: Return ONLY a valid JSON object. No markdown, no explanation, no code fences. Start with { and end with }.`;
    const retryResponse = await generateJson(retryPrompt, {
      userId: opts.userId,
      analysisId: opts.analysisId,
      promptType: 'career-report-retry',
    });
    try {
      parsedJson = JSON.parse(extractJsonBlock(retryResponse));
    } catch (retryErr) {
      logger.error('[AI_SERVICE] JSON parse failed after retry', {
        userId: opts.userId,
        analysisId: opts.analysisId,
        error: (retryErr as Error).message,
        retryResponsePreview: retryResponse.slice(0, 200),
      });
      throw new ApiError(502, 'Gemini did not return valid JSON after retry', ErrorCodes.AI_RESPONSE_INVALID);
    }
  }

  // Validate against schema — use partial parse to save whatever fields are valid
  const validation = geminiCareerReportSchema.safeParse(parsedJson);
  if (validation.success) {
    logger.info('[AI_SERVICE] Schema validation passed', {
      userId: opts.userId,
      analysisId: opts.analysisId,
    });
    return validation.data;
  }

  logger.warn('[AI_SERVICE] Schema validation failed, attempting partial parse', {
    userId: opts.userId,
    analysisId: opts.analysisId,
    issues: validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
  });

  // Partial parse: fill in defaults for missing/invalid fields
  const partial = geminiCareerReportSchema.partial().safeParse(parsedJson);
  if (partial.success) {
    const defaults = geminiCareerReportSchema.parse({});
    return { ...defaults, ...partial.data } as GeminiCareerReport;
  }

  throw new ApiError(
    502,
    `Gemini response failed schema validation: ${validation.error.issues.slice(0, 3).map(i => i.message).join('; ')}`,
    ErrorCodes.AI_RESPONSE_INVALID
  );
}

/** Generates and persists a full career report via Gemini.
 * Uses upsert with conflict handling to avoid duplicate key errors. */
export async function generateCareerReport(
  userId: string,
  analysisId: string,
  promptInput: Parameters<typeof buildCareerAnalysisPrompt>[0]
): Promise<IAIInsight> {
  const prompt = buildCareerAnalysisPrompt(promptInput);
  const report = await callGeminiAndValidate(prompt, { userId, analysisId });

  const reportData = {
    executiveSummary:         report.executiveSummary,
    strengths:                report.strengths,
    weaknesses:               report.weaknesses,
    missingSkills:            report.missingSkills,
    missingTechnologies:      report.missingTechnologies,
    recommendedProjects:      report.recommendedProjects,
    learningRoadmap:          report.learningRoadmap,
    interviewQuestions:       report.interviewQuestions,
    certifications:           report.certifications,
    careerAdvice:             report.careerAdvice,
    plan30Day:                report.plan30Day,
    plan60Day:                report.plan60Day,
    plan90Day:                report.plan90Day,
    interviewReadiness:       report.interviewReadiness,
    industryReadiness:        report.industryReadiness,
    recommendationConfidence: report.recommendationConfidence,
  };

  // FIX BUG 2: Use findOneAndUpdate with proper conflict handling.
  // The unique index on { userId, analysisId } can throw E11000 on concurrent upserts.
  try {
    const insight = await AIInsight.findOneAndUpdate(
      {
        userId:     new Types.ObjectId(userId),
        analysisId: new Types.ObjectId(analysisId),
      },
      {
        $set: {
          targetRole:        promptInput.targetRole,
          report:            reportData,
          rawModelResponse:  JSON.stringify(report),
        },
        $setOnInsert: {
          userId:     new Types.ObjectId(userId),
          analysisId: new Types.ObjectId(analysisId),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (!insight) {
      throw new Error('findOneAndUpdate returned null after upsert');
    }

    logger.info('[AI_SERVICE] AIInsight saved to MongoDB', {
      userId,
      analysisId,
      insightId: String(insight._id),
      hasPlan30: report.plan30Day.length > 0,
      hasRoadmap: report.learningRoadmap.length > 0,
      hasInterview: report.interviewQuestions.length > 0,
    });

    return insight;
  } catch (err: unknown) {
    // FIX BUG 2: Handle MongoDB duplicate key error on concurrent upserts
    if ((err as { code?: number }).code === 11000) {
      logger.warn('[AI_SERVICE] Duplicate key on upsert — fetching existing insight', {
        userId, analysisId,
      });
      // Insight already exists — update it directly
      const existing = await AIInsight.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), analysisId: new Types.ObjectId(analysisId) },
        { $set: { targetRole: promptInput.targetRole, report: reportData, rawModelResponse: JSON.stringify(report) } },
        { new: true }
      );
      if (!existing) throw new ApiError(500, 'Failed to update AI insight after duplicate key error', ErrorCodes.AI_GENERATION_FAILED);
      return existing;
    }
    throw err;
  }
}

/** FIX BUG 4: refreshAIInsights returns { insight, analysisId } so the caller
 * can update analysis.aiInsightId to point to the new insight document. */
export async function refreshAIInsights(
  userId: string,
  analysisId: string,
  promptInput: Parameters<typeof buildCareerAnalysisPrompt>[0]
): Promise<IAIInsight> {
  logger.info('[AI_SERVICE] Refreshing AI insights', { userId, analysisId });

  // Generate first. generateCareerReport uses an atomic upsert, so an existing
  // valid insight remains available if Gemini fails. Never delete the current
  // report before a replacement has been generated and validated.
  const insight = await generateCareerReport(userId, analysisId, promptInput);

  logger.info('[AI_SERVICE] Fresh AI insight generated successfully', {
    userId,
    analysisId,
    insightId: String(insight._id),
  });

  return insight;
}

export async function getInsightByAnalysisId(userId: string, analysisId: string): Promise<IAIInsight | null> {
  return AIInsight.findOne({
    userId:     new Types.ObjectId(userId),
    analysisId: new Types.ObjectId(analysisId),
  });
}
