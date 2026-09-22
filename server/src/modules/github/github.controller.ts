import { Response } from 'express';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import { ok } from '@utils/ApiResponse';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import { connectGitHub, syncGitHubProfile, getGitHubProfile } from './github.service';

export async function connect(req: AuthenticatedRequest, res: Response) {
  const { username } = req.body as { username: string };
  await connectGitHub(req.user!.id, username);
  const synced = await syncGitHubProfile(req.user!.id);
  return res.status(201).json(ok(req, synced));
}

export async function sync(req: AuthenticatedRequest, res: Response) {
  const profile = await syncGitHubProfile(req.user!.id);
  return res.json(ok(req, profile));
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  const profile = await getGitHubProfile(req.user!.id);
  if (!profile) throw new ApiError(404, 'No GitHub account connected', ErrorCodes.GITHUB_PROFILE_NOT_FOUND);
  return res.json(ok(req, profile));
}
