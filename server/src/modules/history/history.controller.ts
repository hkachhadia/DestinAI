import { Response } from 'express';
import { AuthenticatedRequest, JwtUserPayload } from '@middlewares/auth.middleware';
import { ok } from '@utils/ApiResponse';
import { listHistory } from './history.service';

export async function getHistory(req: AuthenticatedRequest, res: Response) {
  const page = Number(req.query.page ?? 1) || 1;
  const limit = Math.min(Number(req.query.limit ?? 20) || 20, 100);
  const result = await listHistory(req.user!.id, page, limit);
  return res.json(ok(req, result));
}
