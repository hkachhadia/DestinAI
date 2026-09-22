import { Router } from 'express';
import { resumeController } from './resume.controller';
import { requireAuth } from '@middlewares/auth.middleware';
import { uploadResume } from '@middlewares/upload.middleware';

const router = Router();

router.use(requireAuth);

router.post('/upload', uploadResume, resumeController.upload);
router.get('/me', resumeController.getMine);
router.get('/:id', resumeController.getById);

export default router;
