"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCareerReport = generateCareerReport;
exports.refreshAIInsights = refreshAIInsights;
exports.getInsightByAnalysisId = getInsightByAnalysisId;
const mongoose_1 = require("mongoose");
const geminiClient_1 = require("./geminiClient");
const careerAnalysisPrompt_1 = require("./prompts/careerAnalysisPrompt");
const geminiCareerReport_schema_1 = require("./geminiCareerReport.schema");
const aiInsight_model_1 = require("./aiInsight.model");
const ApiError_1 = require("../../utils/ApiError");
const logger_1 = require("../../config/logger");
function extractJsonBlock(text) {
    // 1. Try fenced code block:
    // ```json
    // { ... }
    // ```
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
        const inner = fenced[1].trim();
        if (inner.startsWith('{') || inner.startsWith('[')) {
            return inner;
        }
    }
    // 2. Try to extract the outermost JSON object.
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
        return text.slice(jsonStart, jsonEnd + 1);
    }
    // 3. Return trimmed text and let JSON.parse handle the error.
    return text.trim();
}
/**
 * In-flight Gemini generation lock.
 *
 * Key:
 *   userId:analysisId
 *
 * Purpose:
 * Prevent two simultaneous requests for the same analysis from
 * independently consuming Gemini quota.
 *
 * Example:
 *
 * Request A -> Gemini generation starts
 * Request B -> waits for Request A
 * Request A -> saves insight
 * Request B -> receives the same insight
 *
 * This is intentionally process-local. It protects concurrent
 * requests handled by the same Node.js server instance.
 */
const inFlightGenerations = new Map();
function getGenerationKey(userId, analysisId) {
    return `${userId}:${analysisId}`;
}
/**
 * Calls Gemini once and validates its response.
 *
 * IMPORTANT:
 * We intentionally do NOT make a second Gemini request when JSON
 * parsing fails. A malformed response should not silently consume
 * another free-tier request.
 */
async function callGeminiAndValidate(prompt, opts) {
    logger_1.logger.info('[AI_SERVICE] Calling Gemini', {
        userId: opts.userId,
        analysisId: opts.analysisId,
        promptLength: prompt.length,
    });
    const rawResponse = await (0, geminiClient_1.generateJson)(prompt, {
        userId: opts.userId,
        analysisId: opts.analysisId,
        promptType: 'career-report',
    });
    logger_1.logger.info('[AI_SERVICE] Gemini responded, parsing JSON', {
        userId: opts.userId,
        analysisId: opts.analysisId,
        responseLength: rawResponse.length,
    });
    let parsedJson;
    try {
        parsedJson = JSON.parse(extractJsonBlock(rawResponse));
    }
    catch (parseErr) {
        logger_1.logger.error('[AI_SERVICE] Gemini returned invalid JSON', {
            userId: opts.userId,
            analysisId: opts.analysisId,
            error: parseErr.message,
            responsePreview: rawResponse.slice(0, 300),
        });
        /**
         * IMPORTANT:
         *
         * Do NOT call Gemini again here.
         *
         * The previous implementation generated a second Gemini
         * request with a "return JSON only" retry prompt. That can
         * unnecessarily consume another free-tier request.
         */
        throw new ApiError_1.ApiError(502, 'Gemini returned an invalid JSON response. Please try generating the AI report again later.', ApiError_1.ErrorCodes.AI_RESPONSE_INVALID);
    }
    /**
     * First attempt: complete schema validation.
     */
    const validation = geminiCareerReport_schema_1.geminiCareerReportSchema.safeParse(parsedJson);
    if (validation.success) {
        logger_1.logger.info('[AI_SERVICE] Schema validation passed', {
            userId: opts.userId,
            analysisId: opts.analysisId,
        });
        return validation.data;
    }
    logger_1.logger.warn('[AI_SERVICE] Schema validation failed, attempting partial parse', {
        userId: opts.userId,
        analysisId: opts.analysisId,
        issues: validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    });
    /**
     * Preserve the existing partial-parse behavior.
     *
     * This does NOT make another Gemini request.
     */
    const partial = geminiCareerReport_schema_1.geminiCareerReportSchema.partial().safeParse(parsedJson);
    if (partial.success) {
        /**
         * Only use defaults if the schema itself supports parsing
         * an empty object.
         *
         * If it does not, return the partial result rather than
         * triggering another AI request.
         */
        const defaultsResult = geminiCareerReport_schema_1.geminiCareerReportSchema.safeParse({});
        if (defaultsResult.success) {
            return {
                ...defaultsResult.data,
                ...partial.data,
            };
        }
        /**
         * The complete schema has required fields, so parsing {}
         * cannot produce defaults. In that case, the partial result
         * is still the best validated data available.
         */
        return partial.data;
    }
    throw new ApiError_1.ApiError(502, `Gemini response failed schema validation: ${validation.error.issues
        .slice(0, 3)
        .map((issue) => issue.message)
        .join('; ')}`, ApiError_1.ErrorCodes.AI_RESPONSE_INVALID);
}
/**
 * Performs the actual Gemini generation and MongoDB persistence.
 *
 * This function assumes the caller has already handled the
 * cache/in-flight-generation logic.
 */
async function generateCareerReportInternal(userId, analysisId, promptInput) {
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const analysisObjectId = new mongoose_1.Types.ObjectId(analysisId);
    const prompt = (0, careerAnalysisPrompt_1.buildCareerAnalysisPrompt)(promptInput);
    const report = await callGeminiAndValidate(prompt, {
        userId,
        analysisId,
    });
    const reportData = {
        executiveSummary: report.executiveSummary,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        missingSkills: report.missingSkills,
        missingTechnologies: report.missingTechnologies,
        recommendedProjects: report.recommendedProjects,
        learningRoadmap: report.learningRoadmap,
        interviewQuestions: report.interviewQuestions,
        certifications: report.certifications,
        careerAdvice: report.careerAdvice,
        plan30Day: report.plan30Day,
        plan60Day: report.plan60Day,
        plan90Day: report.plan90Day,
        interviewReadiness: report.interviewReadiness,
        industryReadiness: report.industryReadiness,
        recommendationConfidence: report.recommendationConfidence,
    };
    /**
     * Atomic upsert prevents normal duplicate-key problems when
     * multiple requests attempt to save the same analysis.
     */
    try {
        const insight = await aiInsight_model_1.AIInsight.findOneAndUpdate({
            userId: userObjectId,
            analysisId: analysisObjectId,
        }, {
            $set: {
                targetRole: promptInput.targetRole,
                report: reportData,
                rawModelResponse: JSON.stringify(report),
            },
            $setOnInsert: {
                userId: userObjectId,
                analysisId: analysisObjectId,
            },
        }, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        });
        if (!insight) {
            throw new Error('findOneAndUpdate returned null after upsert');
        }
        logger_1.logger.info('[AI_SERVICE] AIInsight saved to MongoDB', {
            userId,
            analysisId,
            insightId: String(insight._id),
            hasPlan30: report.plan30Day.length > 0,
            hasRoadmap: report.learningRoadmap.length > 0,
            hasInterview: report.interviewQuestions.length > 0,
        });
        return insight;
    }
    catch (err) {
        /**
         * Defensive handling for a concurrent duplicate-key race.
         */
        if (err.code === 11000) {
            logger_1.logger.warn('[AI_SERVICE] Duplicate key on upsert — fetching existing insight', {
                userId,
                analysisId,
            });
            const existing = await aiInsight_model_1.AIInsight.findOneAndUpdate({
                userId: userObjectId,
                analysisId: analysisObjectId,
            }, {
                $set: {
                    targetRole: promptInput.targetRole,
                    report: reportData,
                    rawModelResponse: JSON.stringify(report),
                },
            }, {
                new: true,
            });
            if (!existing) {
                throw new ApiError_1.ApiError(500, 'Failed to update AI insight after duplicate key error', ApiError_1.ErrorCodes.AI_GENERATION_FAILED);
            }
            return existing;
        }
        throw err;
    }
}
/**
 * Generates and persists a full career report via Gemini.
 *
 * Free-tier optimization:
 *
 * 1. Existing insight is reused by default.
 * 2. Simultaneous generation requests for the same analysis
 *    share one in-flight Gemini request.
 * 3. Explicit refresh can bypass the existing insight using
 *    forceRegenerate=true.
 */
async function generateCareerReport(userId, analysisId, promptInput, options = {}) {
    const { forceRegenerate = false, } = options;
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const analysisObjectId = new mongoose_1.Types.ObjectId(analysisId);
    const generationKey = getGenerationKey(userId, analysisId);
    /**
     * Normal generation:
     *
     * Reuse an already persisted insight immediately.
     */
    if (!forceRegenerate) {
        const existingInsight = await aiInsight_model_1.AIInsight.findOne({
            userId: userObjectId,
            analysisId: analysisObjectId,
        });
        if (existingInsight) {
            logger_1.logger.info('[AI_SERVICE] Reusing existing AI insight — Gemini call skipped', {
                userId,
                analysisId,
                insightId: String(existingInsight._id),
            });
            return existingInsight;
        }
    }
    /**
     * If another request is already generating this exact report,
     * wait for that request instead of making another Gemini call.
     *
     * This applies to both normal generation and explicit refresh.
     */
    const existingGeneration = inFlightGenerations.get(generationKey);
    if (existingGeneration) {
        logger_1.logger.info('[AI_SERVICE] Generation already in progress — waiting for existing Gemini request', {
            userId,
            analysisId,
        });
        return existingGeneration;
    }
    /**
     * Create the generation promise synchronously BEFORE awaiting
     * anything else.
     *
     * This is important because JavaScript executes synchronously
     * until the first await. Therefore a second request arriving
     * immediately after this point sees the Map entry.
     */
    const generationPromise = (async () => {
        /**
         * Re-check MongoDB after acquiring the in-flight lock.
         *
         * This closes the race where two requests both checked the
         * database before either one had saved the insight.
         *
         * For forceRegenerate=true we intentionally skip this check.
         */
        if (!forceRegenerate) {
            const existingAfterLock = await aiInsight_model_1.AIInsight.findOne({
                userId: userObjectId,
                analysisId: analysisObjectId,
            });
            if (existingAfterLock) {
                logger_1.logger.info('[AI_SERVICE] Insight appeared while waiting for generation lock — Gemini call skipped', {
                    userId,
                    analysisId,
                    insightId: String(existingAfterLock._id),
                });
                return existingAfterLock;
            }
        }
        return generateCareerReportInternal(userId, analysisId, promptInput);
    })();
    inFlightGenerations.set(generationKey, generationPromise);
    try {
        const insight = await generationPromise;
        return insight;
    }
    finally {
        /**
         * Only remove the lock if this exact promise is still the
         * active generation.
         *
         * This prevents an older request from accidentally deleting
         * a newer lock in unusual timing scenarios.
         */
        if (inFlightGenerations.get(generationKey) ===
            generationPromise) {
            inFlightGenerations.delete(generationKey);
        }
        logger_1.logger.info('[AI_SERVICE] Generation lock released', {
            userId,
            analysisId,
        });
    }
}
/**
 * Explicitly regenerates the AI report.
 *
 * Unlike normal generation, this intentionally bypasses the
 * existing cached insight.
 */
async function refreshAIInsights(userId, analysisId, promptInput) {
    logger_1.logger.info('[AI_SERVICE] Refreshing AI insights', {
        userId,
        analysisId,
    });
    /**
     * forceRegenerate=true means this is an intentional Gemini
     * request rather than an accidental duplicate.
     *
     * If another generation for the same analysis is already
     * running, generateCareerReport() will wait for it instead
     * of consuming another Gemini request concurrently.
     */
    const insight = await generateCareerReport(userId, analysisId, promptInput, {
        forceRegenerate: true,
    });
    logger_1.logger.info('[AI_SERVICE] Fresh AI insight generated successfully', {
        userId,
        analysisId,
        insightId: String(insight._id),
    });
    return insight;
}
async function getInsightByAnalysisId(userId, analysisId) {
    return aiInsight_model_1.AIInsight.findOne({
        userId: new mongoose_1.Types.ObjectId(userId),
        analysisId: new mongoose_1.Types.ObjectId(analysisId),
    });
}
//# sourceMappingURL=ai.service.js.map