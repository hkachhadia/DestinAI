import { Response } from 'express';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import { runAnalysis } from './analysis.service';
import { ok } from '@utils/ApiResponse';

export async function run(req: AuthenticatedRequest, res: Response) {
  const {
    targetRole,
    // Platform handles (CHANGE 1: all now accepted)
    githubUsername,
    leetcodeUsername,
    codeforcesHandle,
    codechefUsername,
    gfgUsername,
    hackerrankUsername,
    // Supplemental
    linkedinUrl,
    portfolioUrl,
    kaggleUsername,
    mediumUsername,
    devtoUsername,
  } = req.body as {
    targetRole?: string;
    githubUsername?: string;
    leetcodeUsername?: string;
    codeforcesHandle?: string;
    codechefUsername?: string;
    gfgUsername?: string;
    hackerrankUsername?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    kaggleUsername?: string;
    mediumUsername?: string;
    devtoUsername?: string;
  };

  // forceSync=true ensures GitHub/CP data is always refreshed on re-analysis
  // even if it was synced recently (within the 1-hour stale threshold)
  const analysis = await runAnalysis(req.user!.id, {
    forceSync: true,
    targetRole,
    githubUsername,
    leetcodeUsername,
    codeforcesHandle,
    codechefUsername,
    gfgUsername,
    hackerrankUsername,
    linkedinUrl,
    portfolioUrl,
    kaggleUsername,
    mediumUsername,
    devtoUsername,
  });

  return res.status(201).json(ok(req, analysis));
}

export async function getLatest(req: AuthenticatedRequest, res: Response) {
  const { getLatestAnalysis } = await import('./analysis.service');
  const analysis = await getLatestAnalysis(req.user!.id);
  return res.json({ success: true, data: analysis, message: analysis ? 'OK' : 'No analysis yet', error: null });
}

export async function getOne(req: AuthenticatedRequest, res: Response) {
  const { getAnalysisById } = await import('./analysis.service');
  const analysis = await getAnalysisById(req.user!.id, req.params.id);
  return res.json({ success: true, data: analysis, message: 'OK', error: null });
}
