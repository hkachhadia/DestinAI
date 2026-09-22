import { Router } from 'express';
import { userController } from './user.controller';
import { requireAuth } from '@middlewares/auth.middleware';
import { validate } from '@middlewares/validate.middleware';
import { updateProfileSchema } from './user.validation';

const router = Router();

router.use(requireAuth);

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateMe);
router.delete('/me', userController.deleteMe);
router.get('/me/settings', userController.getSettings);
router.patch('/me/settings', userController.updateSettings);

export default router;
