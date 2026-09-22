import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { authMiddleware, AuthenticatedRequest } from '@middlewares/auth.middleware';
import { asyncHandler } from '@middlewares/asyncHandler';
import { ok } from '@utils/ApiResponse';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import { logger } from '@config/logger';
import { getInsightByAnalysisId, refreshAIInsights } from './ai.service';
import { getLatestAnalysis, getAnalysisById } from '@modules/analysis/analysis.service';
import { Analysis } from '@modules/analysis/analysis.model';
import { getLatestResume } from '@modules/resume/resume.service';
import { getGitHubProfile } from '@modules/github/github.service';
import { getAllProfiles } from '@modules/competitiveProgramming/cp.service';

const router = Router();
router.use(authMiddleware);

/**
 * GET /ai/insights/career-report/latest
 * Returns the stored AI insight for the most recent analysis.
 * Searches by analysisId so a refreshed insight is always found correctly.
 */
router.get(
  '/insights/career-report/latest',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await getLatestAnalysis(req.user!.id);
    if (!analysis) {
      throw new ApiError(404, 'No analysis found. Run a career scan first.', ErrorCodes.ANALYSIS_NOT_FOUND);
    }

    // FIX BUG 4: Search by (userId, analysisId) not by aiInsightId reference.
    // This ensures we always find the insight even if aiInsightId was not updated.
    const insight = await getInsightByAnalysisId(req.user!.id, String(analysis._id));

    logger.info('[AI_ROUTE] Fetched latest insight', {
      userId: req.user!.id,
      analysisId: String(analysis._id),
      hasInsight: !!insight,
    });

    // Include a human-readable status so the frontend can show the right message
    const aiStatus = insight
      ? 'ready'
      : 'pending_refresh'; // click "Refresh AI Insights" to generate

    return res.json(ok(req, { analysis, insight, aiStatus }));
  })
);

/**
 * GET /ai/insights/career-report/:analysisId
 */
router.get(
  '/insights/career-report/:analysisId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await getAnalysisById(req.user!.id, req.params.analysisId);
    const insight = await getInsightByAnalysisId(req.user!.id, String(analysis._id));
    return res.json(ok(req, { analysis, insight }));
  })
);

/**
 * POST /ai/insights/refresh
 * FIX BUG 4: After refreshing the insight, update Analysis.aiInsightId to
 * point to the new insight document. Without this, GET /latest always returned
 * insight: null because aiInsightId referenced the deleted document.
 */
router.post(
  '/insights/refresh',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await getLatestAnalysis(req.user!.id);
    if (!analysis) {
      throw new ApiError(404, 'No analysis to refresh. Run a career scan first.', ErrorCodes.ANALYSIS_NOT_FOUND);
    }

    logger.info('[AI_ROUTE] Starting insight refresh', {
      userId: req.user!.id,
      analysisId: String(analysis._id),
    });

    // Fetch the latest real profile data for Gemini context
    const [resume, github, competitiveProfiles] = await Promise.all([
      getLatestResume(req.user!.id),
      getGitHubProfile(req.user!.id),
      getAllProfiles(req.user!.id),
    ]);

    const insight = await refreshAIInsights(req.user!.id, String(analysis._id), {
      targetRole:              analysis.targetRole,
      resume,
      github,
      competitiveProfiles,
      scores:                  analysis.scores,
      missingSkillsFromEngine: analysis.skillMatch?.missingSkills ?? [],
    });

    // FIX BUG 4: Update aiInsightId on the Analysis document to point to new insight
    await Analysis.findByIdAndUpdate(
      analysis._id,
      { aiInsightId: new Types.ObjectId(String(insight._id)) }
    );

    logger.info('[AI_ROUTE] Insight refresh complete, aiInsightId updated', {
      userId: req.user!.id,
      analysisId: String(analysis._id),
      newInsightId: String(insight._id),
    });

    return res.status(201).json(ok(req, { analysis, insight }));
  })
);

/**
 * GET /ai/insights/interview-prep
 */
router.get(
  '/insights/interview-prep',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await getLatestAnalysis(req.user!.id);
    if (!analysis) {
      throw new ApiError(404, 'No AI insight found. Run a career analysis first.', ErrorCodes.ANALYSIS_NOT_FOUND);
    }

    // FIX BUG 4: Always look up by (userId, analysisId), not aiInsightId
    const insight = await getInsightByAnalysisId(req.user!.id, String(analysis._id));

    if (!insight || insight.report.interviewQuestions.length === 0) {
      throw new ApiError(
        404,
        'No interview questions yet. Click "Refresh AI Insights" to generate them.',
        ErrorCodes.ANALYSIS_NOT_FOUND
      );
    }

    return res.json(ok(req, {
      targetRole:         analysis.targetRole,
      questions:          insight.report.interviewQuestions,
      careerAdvice:       insight.report.careerAdvice,
      interviewReadiness: insight.report.interviewReadiness,
    }));
  })
);

export default router;

/**
 * GET /ai/diagnostic
 * Backend-only Gemini connectivity test.
 * Protected by auth — never exposes the API key.
 * Returns { ok: true, model } on success or { ok: false, error } on failure.
 */
router.get(
  '/diagnostic',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { env } = await import('@config/env');
    const { generateJson } = await import('./geminiClient');

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
      const result = await generateJson(
        'Return exactly this JSON and nothing else: {"status":"ok"}',
        { userId: req.user!.id, promptType: 'diagnostic' }
      );
      return res.json({
        ok: true,
        model,
        latencyMs: Date.now() - start,
        preview: result.slice(0, 50),
      });
    } catch (err) {
      return res.status(502).json({
        ok: false,
        model,
        error: (err as Error).message,
        hint: (err as Error).message.includes('403') || (err as Error).message.includes('401')
          ? 'Gemini authentication failed. Create/verify an authorization API key in Google AI Studio and store it as GEMINI_API_KEY on the backend.'
          : 'Check server logs for details',
      });
    }
  })
);
