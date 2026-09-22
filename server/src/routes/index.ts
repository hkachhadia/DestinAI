import { Router } from 'express';
import authRoutes from '@modules/auth/auth.routes';
import userRoutes from '@modules/user/user.routes';
import resumeRoutes from '@modules/resume/resume.routes';
import githubRoutes from '@modules/github/github.routes';
import cpRoutes from '@modules/competitiveProgramming/cp.routes';
import analysisRoutes from '@modules/analysis/analysis.routes';
import aiRoutes from '@modules/ai/ai.routes';
import scoreRoutes from '@modules/score/score.routes';
import dashboardRoutes from '@modules/dashboard/dashboard.routes';
import historyRoutes from '@modules/history/history.routes';
import compareRoutes from '@modules/compare/compare.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'DestinAI API is healthy',
    data: { timestamp: new Date().toISOString(), version: '1.0.0' },
  });
});

// Phase 1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/resumes', resumeRoutes);

// Phase 2
router.use('/github', githubRoutes);
router.use('/cp', cpRoutes);
router.use('/analysis', analysisRoutes);
router.use('/ai', aiRoutes);
router.use('/score', scoreRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/history', historyRoutes);
router.use('/compare', compareRoutes);

export default router;
