import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '@middlewares/validate.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { authRateLimiter } from '@middlewares/rateLimiter.middleware';
import { signupSchema, loginSchema, refreshSchema } from './auth.validation';

const router = Router();

router.post('/signup',  authRateLimiter, validate(signupSchema),  authController.signup);
router.post('/login',   authRateLimiter, validate(loginSchema),   authController.login);
router.post('/refresh', authRateLimiter, validate(refreshSchema), authController.refresh);
router.post('/logout',  requireAuth,                              authController.logout);
router.get('/me',       requireAuth,                              authController.me);

export default router;
