import { Response, Request } from 'express';

// Merged unified response helpers
// Server-1 style: class methods
export class ApiResponse {
  static ok<T>(res: Response, data: T, message = 'Success') {
    return res.status(200).json({ success: true, data, message, error: null });
  }
  static created<T>(res: Response, data: T, message = 'Created') {
    return res.status(201).json({ success: true, data, message, error: null });
  }
}

// Server-2 style: functional helpers (ok(req, data) => plain object)
export function ok<T>(req: Request, data: T): { success: true; data: T; error: null } {
  void req; // req kept for signature compatibility with server-2 callers
  return { success: true, data, error: null };
}

export function fail(req: Request, code: string, message: string) {
  void req;
  return { success: false, data: null, error: { code, message } };
}
