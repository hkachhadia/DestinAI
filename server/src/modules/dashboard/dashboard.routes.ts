import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '@middlewares/auth.middleware';
import { asyncHandler } from '@middlewares/asyncHandler';
import { ok } from '@utils/ApiResponse';
import { getDashboard } from './dashboard.service';

async function getDashboardHandler(req: AuthenticatedRequest, res: Response) {
  const payload = await getDashboard(req.user!.id);
  return res.json(ok(req, payload));
}

const router = Router();
router.use(authMiddleware);
router.get('/', asyncHandler(getDashboardHandler));

export default router;
