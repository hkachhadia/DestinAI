import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '@middlewares/auth.middleware';
import { asyncHandler } from '@middlewares/asyncHandler';
import { validate } from '@middlewares/validate.middleware';
import * as githubController from './github.controller';

const router = Router();
router.use(authMiddleware);

const connectSchema = z.object({
  username: z.string().min(1, 'GitHub username is required').max(39),
});

router.post('/connect', validate(connectSchema), asyncHandler(githubController.connect));
router.post('/sync', asyncHandler(githubController.sync));
router.get('/profile', asyncHandler(githubController.getProfile));

export default router;
