import { Response } from 'express';
import { AuthenticatedRequest } from '@middlewares/auth.middleware';
import { ok } from '@utils/ApiResponse';
import { connectPlatform, syncPlatform, syncAllPlatforms, getAllProfiles } from './cp.service';

export async function connect(req: AuthenticatedRequest, res: Response) {
  const { platform, handle } = req.body as { platform: string; handle: string };
  const profile = await connectPlatform(req.user!.id, platform, handle);
  return res.status(201).json(ok(req, profile));
}

export async function sync(req: AuthenticatedRequest, res: Response) {
  const { platform } = req.params as { platform: string };
  const profile = await syncPlatform(req.user!.id, platform);
  return res.json(ok(req, profile));
}

export async function syncAll(req: AuthenticatedRequest, res: Response) {
  const profiles = await syncAllPlatforms(req.user!.id);
  return res.json(ok(req, profiles));
}

export async function getProfiles(req: AuthenticatedRequest, res: Response) {
  const profiles = await getAllProfiles(req.user!.id);
  return res.json(ok(req, profiles));
}
