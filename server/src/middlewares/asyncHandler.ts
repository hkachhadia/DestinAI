import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AsyncFn<T extends Request = Request> = (req: T, res: Response, next: NextFunction) => Promise<any>;

// Generic asyncHandler — accepts any Request subtype (e.g. AuthenticatedRequest)
export function asyncHandler<T extends Request = Request>(fn: AsyncFn<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
}
