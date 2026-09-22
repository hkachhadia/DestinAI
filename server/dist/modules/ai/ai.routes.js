"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mongoose_1 = require("mongoose");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const asyncHandler_1 = require("../../middlewares/asyncHandler");
const ApiResponse_1 = require("../../utils/ApiResponse");
const ApiError_1 = require("../../utils/ApiError");
const logger_1 = require("../../config/logger");
const ai_service_1 = require("./ai.service");
const analysis_service_1 = require("../analysis/analysis.service");
const analysis_model_1 = require("../analysis/analysis.model");
const resume_service_1 = require("../resume/resume.service");
const github_service_1 = require("../github/github.service");
const cp_service_1 = require("../competitiveProgramming/cp.service");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
/**
 * GET /ai/insights/career-report/latest
 * Returns the stored AI insight for the most recent analysis.
 * Searches by analysisId so a refreshed insight is always found correctly.
 */
router.get('/insights/career-report/latest', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const analysis = await (0, analysis_service_1.getLatestAnalysis)(req.user.id);
    if (!analysis) {
        throw new ApiError_1.ApiError(404, 'No analysis found. Run a career scan first.', ApiError_1.ErrorCodes.ANALYSIS_NOT_FOUND);
    }
    // FIX BUG 4: Search by (userId, analysisId) not by aiInsightId reference.
    // This ensures we always find the insight even if aiInsightId was not updated.
    const insight = await (0, ai_service_1.getInsightByAnalysisId)(req.user.id, String(analysis._id));
    logger_1.logger.info('[AI_ROUTE] Fetched latest insight', {
        userId: req.user.id,
        analysisId: String(analysis._id),
        hasInsight: !!insight,
    });
    // Include a human-readable status so the frontend can show the right message
    const aiStatus = insight
        ? 'ready'
        : 'pending_refresh'; // click "Refresh AI Insights" to generate
    return res.json((0, ApiResponse_1.ok)(req, { analysis, insight, aiStatus }));
}));
/**
 * GET /ai/insights/career-report/:analysisId
 */
router.get('/insights/career-report/:analysisId', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const analysis = await (0, analysis_service_1.getAnalysisById)(req.user.id, req.params.analysisId);
    const insight = await (0, ai_service_1.getInsightByAnalysisId)(req.user.id, String(analysis._id));
    return res.json((0, ApiResponse_1.ok)(req, { analysis, insight }));
}));
/**
 * POST /ai/insights/refresh
 * FIX BUG 4: After refreshing the insight, update Analysis.aiInsightId to
 * point to the new insight document. Without this, GET /latest always returned
 * insight: null because aiInsightId referenced the deleted document.
 */
router.post('/insights/refresh', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const analysis = await (0, analysis_service_1.getLatestAnalysis)(req.user.id);
    if (!analysis) {
        throw new ApiError_1.ApiError(404, 'No analysis to refresh. Run a career scan first.', ApiError_1.ErrorCodes.ANALYSIS_NOT_FOUND);
    }
    logger_1.logger.info('[AI_ROUTE] Starting insight refresh', {
        userId: req.user.id,
        analysisId: String(analysis._id),
    });
    // Fetch the latest real profile data for Gemini context
    const [resume, github, competitiveProfiles] = await Promise.all([
        (0, resume_service_1.getLatestResume)(req.user.id),
        (0, github_service_1.getGitHubProfile)(req.user.id),
        (0, cp_service_1.getAllProfiles)(req.user.id),
    ]);
    const insight = await (0, ai_service_1.refreshAIInsights)(req.user.id, String(analysis._id), {
        targetRole: analysis.targetRole,
        resume,
        github,
        competitiveProfiles,
        scores: analysis.scores,
        missingSkillsFromEngine: analysis.skillMatch?.missingSkills ?? [],
    });
    // FIX BUG 4: Update aiInsightId on the Analysis document to point to new insight
    await analysis_model_1.Analysis.findByIdAndUpdate(analysis._id, { aiInsightId: new mongoose_1.Types.ObjectId(String(insight._id)) });
    logger_1.logger.info('[AI_ROUTE] Insight refresh complete, aiInsightId updated', {
        userId: req.user.id,
        analysisId: String(analysis._id),
        newInsightId: String(insight._id),
    });
    return res.status(201).json((0, ApiResponse_1.ok)(req, { analysis, insight }));
}));
/**
 * GET /ai/insights/interview-prep
 */
router.get('/insights/interview-prep', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const analysis = await (0, analysis_service_1.getLatestAnalysis)(req.user.id);
    if (!analysis) {
        throw new ApiError_1.ApiError(404, 'No AI insight found. Run a career analysis first.', ApiError_1.ErrorCodes.ANALYSIS_NOT_FOUND);
    }
    // FIX BUG 4: Always look up by (userId, analysisId), not aiInsightId
    const insight = await (0, ai_service_1.getInsightByAnalysisId)(req.user.id, String(analysis._id));
    if (!insight || insight.report.interviewQuestions.length === 0) {
        throw new ApiError_1.ApiError(404, 'No interview questions yet. Click "Refresh AI Insights" to generate them.', ApiError_1.ErrorCodes.ANALYSIS_NOT_FOUND);
    }
    return res.json((0, ApiResponse_1.ok)(req, {
        targetRole: analysis.targetRole,
        questions: insight.report.interviewQuestions,
        careerAdvice: insight.report.careerAdvice,
        interviewReadiness: insight.report.interviewReadiness,
    }));
}));
exports.default = router;
/**
 * GET /ai/diagnostic
 * Backend-only Gemini connectivity test.
 * Protected by auth — never exposes the API key.
 * Returns { ok: true, model } on success or { ok: false, error } on failure.
 */
router.get('/diagnostic', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { env } = await Promise.resolve().then(() => __importStar(require('../../config/env')));
    const { generateJson } = await Promise.resolve().then(() => __importStar(require('./geminiClient')));
    if (!env.GEMINI_API_KEY) {
        return res.status(503).json({
            ok: false,
            error: 'GEMINI_API_KEY not set in server/.env',
            hint: 'Get a free key from https://aistudio.google.com/app/apikey',
        });
    }
    const model = env.GEMINI_MODEL ?? 'gemini-3.8-flash';
    const start = Date.now();
    try {
        const result = await generateJson('Return exactly this JSON and nothing else: {"status":"ok"}', { userId: req.user.id, promptType: 'diagnostic' });
        return res.json({
            ok: true,
            model,
            latencyMs: Date.now() - start,
            preview: result.slice(0, 50),
        });
    }
    catch (err) {
        return res.status(502).json({
            ok: false,
            model,
            error: err.message,
            hint: err.message.includes('403') || err.message.includes('401')
                ? 'Gemini authentication failed. Create/verify an authorization API key in Google AI Studio and store it as GEMINI_API_KEY on the backend.'
                : 'Check server logs for details',
        });
    }
}));
//# sourceMappingURL=ai.routes.js.map