import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '@utils/ApiError';

export interface JwtUserPayload {
  userId: string;
  id: string;
  email: string;
  role: 'user' | 'admin';
}

export interface AuthenticatedRequest extends Request {
  user: JwtUserPayload;
}

interface JwtAccessPayload {
  sub: string;
  email: string;
  role?: 'user' | 'admin';
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtAccessPayload;
    req.user = {
      userId: payload.sub,
      id: payload.sub,
      email: payload.email,
      role: payload.role ?? 'user',
    };
    return next();
  } catch {
    return next(ApiError.unauthorized('Access token is invalid or expired', 'TOKEN_INVALID'));
  }
}

export const authMiddleware = requireAuth;
