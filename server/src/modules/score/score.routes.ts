import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '@middlewares/auth.middleware';
import { asyncHandler } from '@middlewares/asyncHandler';
import { ok } from '@utils/ApiResponse';
import { getDashboard } from '@modules/dashboard/dashboard.service';
import { listHistory } from '@modules/history/history.service';
import { compareAnalyses } from '@modules/compare/compare.service';
import { ApiError, ErrorCodes } from '@utils/ApiError';

const router = Router();
router.use(authMiddleware);

/**
 * GET /score/overview
 * Powers: Dashboard score rings + Analytics charts + AI recommendation card.
 * Delegates to dashboard.service which aggregates Analysis + GitHub + CP data.
 */
router.get('/overview', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const payload = await getDashboard(req.user!.id);
  return res.json(ok(req, payload));
}));

/**
 * GET /score/history?page=1&limit=20
 * Powers: HistoryPage — paginated list of past analysis sessions.
 */
router.get('/history', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
  const raw = await listHistory(req.user!.id, page, limit);

  // Shape to match the frontend HistoryListResponse type
  const entries = raw.entries.map((a) => ({
    id: String(a._id),
    title: a.targetRole ?? 'Career Analysis',
    date: a.createdAt.toISOString(),
    score: a.scores.careerScore,
    icon: 'auto_graph',
  }));

  return res.json(ok(req, { entries, total: raw.total }));
}));

/**
 * GET /score/comparison?baseId=&compareId=
 * Powers: ComparisonPage — side-by-side diff of two analysis snapshots.
 */
router.get('/comparison', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { baseId, compareId } = req.query as { baseId?: string; compareId?: string };
  if (!baseId || !compareId) {
    throw new ApiError(400, 'baseId and compareId query params are required', ErrorCodes.VALIDATION_ERROR);
  }
  const result = await compareAnalyses(req.user!.id, baseId, compareId);

  // Shape to match frontend ComparisonResult type
  const shaped = {
    base: {
      id: String(result.base._id),
      label: `Earlier Scan — ${new Date(result.base.createdAt).toLocaleDateString()}`,
      roleTitle: result.base.targetRole ?? 'Career Analysis',
      focusArea: (result.base.skillMatch?.matchedSkills ?? []).slice(0, 2).join(', ') || 'General',
      score: result.base.scores.careerScore,
      scores: result.base.scores,
      skillMatch: result.base.skillMatch,
      date: result.base.createdAt.toISOString(),
    },
    compare: {
      id: String(result.compare._id),
      label: `Latest Scan — ${new Date(result.compare.createdAt).toLocaleDateString()}`,
      roleTitle: result.compare.targetRole ?? 'Career Analysis',
      focusArea: (result.compare.skillMatch?.matchedSkills ?? []).slice(0, 2).join(', ') || 'General',
      score: result.compare.scores.careerScore,
      scores: result.compare.scores,
      skillMatch: result.compare.skillMatch,
      date: result.compare.createdAt.toISOString(),
    },
    deltaPercent: result.deltaPercent,
    scoreDeltas: result.scoreDeltas,
    newlyMatchedSkills: result.newlyMatchedSkills,
    skillsLost: result.skillsLost ?? [],
    stillMissingSkills: result.stillMissingSkills,
    improvedSkillCount: result.improvedSkillCount ?? 0,
    insight: result.insight,
  };

  return res.json(ok(req, shaped));
}));

/**
 * POST /score/recompute
 * Forces a fresh scoring-engine run (used after new resume/GitHub/CP sync).
 */
router.post('/recompute', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { runAnalysis } = await import('@modules/analysis/analysis.service');
  await runAnalysis(req.user!.id, { skipAIReport: true });
  const payload = await getDashboard(req.user!.id);
  return res.json(ok(req, payload));
}));

export default router;
