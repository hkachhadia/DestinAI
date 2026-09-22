import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '@middlewares/auth.middleware';
import { asyncHandler } from '@middlewares/asyncHandler';
import { validate } from '@middlewares/validate.middleware';
import * as analysisController from './analysis.controller';

const router = Router();
router.use(authMiddleware);

// Accept all platform handles — empty string treated as "no change" in service layer
const runSchema = z.object({
  targetRole:          z.string().min(1).max(120).optional(),
  // Coding platform handles
  githubUsername:      z.string().max(39).optional(),
  leetcodeUsername:    z.string().max(50).optional(),
  codeforcesHandle:    z.string().max(50).optional(),
  codechefUsername:    z.string().max(50).optional(),
  gfgUsername:         z.string().max(50).optional(),
  hackerrankUsername:  z.string().max(50).optional(),
  // Supplemental fields
  linkedinUrl:         z.string().max(500).optional(),
  portfolioUrl:        z.string().max(500).optional(),
  kaggleUsername:      z.string().max(50).optional(),
  mediumUsername:      z.string().max(50).optional(),
  devtoUsername:       z.string().max(50).optional(),
});

router.post('/', validate(runSchema), asyncHandler(analysisController.run));
router.get('/latest', asyncHandler(analysisController.getLatest));
router.get('/:id', asyncHandler(analysisController.getOne));

export default router;
