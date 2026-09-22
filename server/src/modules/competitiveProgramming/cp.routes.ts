import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '@middlewares/auth.middleware';
import { asyncHandler } from '@middlewares/asyncHandler';
import { validate } from '@middlewares/validate.middleware';
import { CP_PLATFORMS } from './cp.model';
import * as cpController from './cp.controller';

const router = Router();
router.use(authMiddleware);

const connectSchema = z.object({
  platform: z.enum(CP_PLATFORMS as [string, ...string[]]),
  handle: z.string().min(1, 'Handle is required').max(50),
});

router.post('/connect', validate(connectSchema), asyncHandler(cpController.connect));
router.post('/sync', asyncHandler(cpController.syncAll));
router.post('/sync/:platform', asyncHandler(cpController.sync));
router.get('/profiles', asyncHandler(cpController.getProfiles));

export default router;
