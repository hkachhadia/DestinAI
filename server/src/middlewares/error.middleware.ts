import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { ApiError, ErrorCodes } from '@utils/ApiError';
import { logger } from '@config/logger';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      data: null,
      message: err.message,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      data: null,
      message: messages.join('; '),
      error: { code: ErrorCodes.VALIDATION_ERROR, message: messages.join('; ') },
    });
  }

  if ((err as { code?: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      data: null,
      message: 'A record with that value already exists',
      error: { code: 'DUPLICATE_KEY', message: 'A record with that value already exists' },
    });
  }

  logger.error('Unhandled error', { error: err, path: req.path, method: req.method });

  return res.status(500).json({
    success: false,
    data: null,
    message: 'An unexpected error occurred',
    error: { code: ErrorCodes.UNKNOWN_ERROR, message: 'An unexpected error occurred' },
  });
}

export { errorHandler as errorMiddleware };
