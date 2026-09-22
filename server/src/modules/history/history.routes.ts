import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '@middlewares/auth.middleware';
import { asyncHandler } from '@middlewares/asyncHandler';
import { validate } from '@middlewares/validate.middleware';
import { ok } from '@utils/ApiResponse';
import { getHistory } from './history.controller';
import { deleteAnalysis, deleteAllAnalyses } from '../analysis/analysis.service';

const router = Router();
router.use(authMiddleware);

// GET /history — paginated list
router.get('/', asyncHandler(getHistory));

// DELETE /history/all — delete every history entry for this user
router.delete(
  '/all',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const result = await deleteAllAnalyses(req.user!.id);
    return res.json(ok(req, result));
  })
);

// DELETE /history/batch — delete multiple entries by IDs
const batchDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one ID is required'),
});
router.delete(
  '/batch',
  validate(batchDeleteSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { ids } = req.body as { ids: string[] };
    const results = await Promise.allSettled(ids.map((id) => deleteAnalysis(req.user!.id, id)));
    const deleted = results.filter((r) => r.status === 'fulfilled').length;
    return res.json(ok(req, { deleted, total: ids.length }));
  })
);

// DELETE /history/:id — delete a single entry
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    await deleteAnalysis(req.user!.id, req.params.id);
    return res.json(ok(req, { deleted: 1 }));
  })
);

export default router;
