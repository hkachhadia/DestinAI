import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthenticatedRequest } from '@middlewares/auth.middleware';
import { asyncHandler } from '@middlewares/asyncHandler';
import { validate } from '@middlewares/validate.middleware';
import { ok } from '@utils/ApiResponse';
import { compareAnalyses } from './compare.service';

async function getComparison(req: AuthenticatedRequest, res: Response) {
  const { baseId, compareId } = req.query as { baseId: string; compareId: string };
  const result = await compareAnalyses(req.user!.id, baseId, compareId);
  return res.json(ok(req, result));
}

const router = Router();
router.use(authMiddleware);

const querySchema = z.object({
  baseId: z.string().min(1, 'baseId is required'),
  compareId: z.string().min(1, 'compareId is required'),
});

router.get('/', validate(querySchema, 'query'), asyncHandler(getComparison));
export default router;
