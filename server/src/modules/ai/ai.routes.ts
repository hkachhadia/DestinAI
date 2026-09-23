import { Router, Response } from 'express';
import { Types } from 'mongoose';

import {
  authMiddleware,
  AuthenticatedRequest,
} from '@middlewares/auth.middleware';

import { asyncHandler } from '@middlewares/asyncHandler';
import { ok } from '@utils/ApiResponse';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import { logger } from '@config/logger';

import {
  generateCareerReport,
  getInsightByAnalysisId,
  refreshAIInsights,
} from './ai.service';

import {
  getLatestAnalysis,
  getAnalysisById,
} from '@modules/analysis/analysis.service';

import { Analysis } from '@modules/analysis/analysis.model';
import { getLatestResume } from '@modules/resume/resume.service';
import { getGitHubProfile } from '@modules/github/github.service';
import { getAllProfiles } from '@modules/competitiveProgramming/cp.service';

const router = Router();

router.use(authMiddleware);

/**
 * GET /ai/insights/career-report/latest
 *
 * Returns the stored AI insight for the most recent analysis.
 *
 * If the deterministic analysis has completed but Gemini has not
 * finished yet, insight will be null and aiStatus will be pending_refresh.
 */
router.get(
  '/insights/career-report/latest',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await getLatestAnalysis(req.user!.id);

    if (!analysis) {
      throw new ApiError(
        404,
        'No analysis found. Run a career scan first.',
        ErrorCodes.ANALYSIS_NOT_FOUND,
      );
    }

    // Search by userId + analysisId instead of aiInsightId.
    // This guarantees the correct insight is found for this analysis.
    const insight = await getInsightByAnalysisId(
      req.user!.id,
      String(analysis._id),
    );

    logger.info('[AI_ROUTE] Fetched latest insight', {
      userId: req.user!.id,
      analysisId: String(analysis._id),
      hasInsight: !!insight,
    });

    const aiStatus = insight ? 'ready' : 'pending_refresh';

    return res.json(
      ok(req, {
        analysis,
        insight,
        aiStatus,
      }),
    );
  }),
);

/**
 * POST /ai/insights/generate/:analysisId
 *
 * Generates the AI report for one exact analysis.
 *
 * IMPORTANT:
 * This endpoint is intentionally separate from POST /analysis.
 * The deterministic analysis can therefore return immediately without
 * waiting for Gemini.
 */
router.post(
  '/insights/generate/:analysisId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { analysisId } = req.params;

    logger.info('[AI_ROUTE] Starting AI report generation', {
      userId: req.user!.id,
      analysisId,
    });

    // Verify that this analysis belongs to the authenticated user.
    const analysis = await getAnalysisById(
      req.user!.id,
      analysisId,
    );

    if (!analysis) {
      throw new ApiError(
        404,
        'Analysis not found.',
        ErrorCodes.ANALYSIS_NOT_FOUND,
      );
    }

    // Fetch the latest real data used for the AI report.
    const [resume, github, competitiveProfiles] = await Promise.all([
      getLatestResume(req.user!.id),
      getGitHubProfile(req.user!.id),
      getAllProfiles(req.user!.id),
    ]);

    try {
      const insight = await generateCareerReport(
        req.user!.id,
        String(analysis._id),
        {
          targetRole: analysis.targetRole,
          resume,
          github,
          competitiveProfiles,
          scores: analysis.scores,
          missingSkillsFromEngine:
            analysis.skillMatch?.missingSkills ?? [],
        },
      );

      // Keep the analysis -> insight reference synchronized.
      await Analysis.findByIdAndUpdate(
        analysis._id,
        {
          aiInsightId: new Types.ObjectId(String(insight._id)),
        },
      );

      logger.info('[AI_ROUTE] AI report generation completed', {
        userId: req.user!.id,
        analysisId: String(analysis._id),
        insightId: String(insight._id),
      });

      return res.status(201).json(
        ok(req, {
          analysis,
          insight,
          aiStatus: 'ready',
        }),
      );
    } catch (err) {
      logger.error('[AI_ROUTE] AI report generation failed', {
        userId: req.user!.id,
        analysisId: String(analysis._id),
        error: err instanceof Error ? err.message : String(err),
      });

      throw err;
    }
  }),
);

/**
 * GET /ai/insights/career-report/:analysisId
 */
router.get(
  '/insights/career-report/:analysisId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await getAnalysisById(
      req.user!.id,
      req.params.analysisId,
    );

    const insight = await getInsightByAnalysisId(
      req.user!.id,
      String(analysis._id),
    );

    return res.json(
      ok(req, {
        analysis,
        insight,
      }),
    );
  }),
);

/**
 * POST /ai/insights/refresh
 *
 * Regenerates the AI insight for the latest analysis.
 *
 * This remains available for the existing "Refresh AI Insights"
 * functionality.
 */
router.post(
  '/insights/refresh',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await getLatestAnalysis(req.user!.id);

    if (!analysis) {
      throw new ApiError(
        404,
        'No analysis to refresh. Run a career scan first.',
        ErrorCodes.ANALYSIS_NOT_FOUND,
      );
    }

    logger.info('[AI_ROUTE] Starting insight refresh', {
      userId: req.user!.id,
      analysisId: String(analysis._id),
    });

    // Fetch the latest real profile data for Gemini context.
    const [resume, github, competitiveProfiles] = await Promise.all([
      getLatestResume(req.user!.id),
      getGitHubProfile(req.user!.id),
      getAllProfiles(req.user!.id),
    ]);

    const insight = await refreshAIInsights(
      req.user!.id,
      String(analysis._id),
      {
        targetRole: analysis.targetRole,
        resume,
        github,
        competitiveProfiles,
        scores: analysis.scores,
        missingSkillsFromEngine:
          analysis.skillMatch?.missingSkills ?? [],
      },
    );

    // Update the Analysis document to point to the new insight.
    await Analysis.findByIdAndUpdate(
      analysis._id,
      {
        aiInsightId: new Types.ObjectId(String(insight._id)),
      },
    );

    logger.info(
      '[AI_ROUTE] Insight refresh complete, aiInsightId updated',
      {
        userId: req.user!.id,
        analysisId: String(analysis._id),
        newInsightId: String(insight._id),
      },
    );

    return res.status(201).json(
      ok(req, {
        analysis,
        insight,
      }),
    );
  }),
);

/**
 * GET /ai/insights/interview-prep
 */
router.get(
  '/insights/interview-prep',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const analysis = await getLatestAnalysis(req.user!.id);

    if (!analysis) {
      throw new ApiError(
        404,
        'No AI insight found. Run a career analysis first.',
        ErrorCodes.ANALYSIS_NOT_FOUND,
      );
    }

    const insight = await getInsightByAnalysisId(
      req.user!.id,
      String(analysis._id),
    );

    if (
      !insight ||
      insight.report.interviewQuestions.length === 0
    ) {
      throw new ApiError(
        404,
        'No interview questions yet. Click "Refresh AI Insights" to generate them.',
        ErrorCodes.ANALYSIS_NOT_FOUND,
      );
    }

    return res.json(
      ok(req, {
        targetRole: analysis.targetRole,
        questions: insight.report.interviewQuestions,
        careerAdvice: insight.report.careerAdvice,
        interviewReadiness: insight.report.interviewReadiness,
      }),
    );
  }),
);

/**
 * GET /ai/diagnostic
 *
 * Backend-only Gemini connectivity test.
 * Protected by auth — never exposes the API key.
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
        {
          userId: req.user!.id,
          promptType: 'diagnostic',
        },
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
        hint:
          (err as Error).message.includes('403') ||
          (err as Error).message.includes('401')
            ? 'Gemini authentication failed. Create/verify an authorization API key in Google AI Studio and store it as GEMINI_API_KEY on the backend.'
            : 'Check server logs for details',
      });
    }
  }),
);

export default router;