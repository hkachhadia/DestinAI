export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code = 'API_ERROR', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, code = 'BAD_REQUEST', details?: unknown) {
    return new ApiError(400, message, code, details);
  }
  static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }
  static forbidden(message = 'Forbidden', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }
  static notFound(message = 'Not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }
  static conflict(message: string, code = 'CONFLICT') {
    return new ApiError(409, message, code);
  }
  static unprocessable(message: string, code = 'UNPROCESSABLE') {
    return new ApiError(422, message, code);
  }
  static tooManyRequests(message = 'Too many requests', code = 'RATE_LIMITED') { return new ApiError(429, message, code); }
  static internal(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    return new ApiError(500, message, code);
  }
}

export const ErrorCodes = {
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  RESUME_NOT_FOUND: 'RESUME_NOT_FOUND',
  RESUME_PARSE_FAILED: 'RESUME_PARSE_FAILED',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  GITHUB_PROFILE_NOT_FOUND: 'GITHUB_PROFILE_NOT_FOUND',
  GITHUB_RATE_LIMITED: 'GITHUB_RATE_LIMITED',
  GITHUB_USER_NOT_FOUND: 'GITHUB_USER_NOT_FOUND',
  GITHUB_SYNC_FAILED: 'GITHUB_SYNC_FAILED',
  CP_PLATFORM_UNSUPPORTED: 'CP_PLATFORM_UNSUPPORTED',
  CP_HANDLE_NOT_FOUND: 'CP_HANDLE_NOT_FOUND',
  CP_SYNC_FAILED: 'CP_SYNC_FAILED',
  AI_RESPONSE_INVALID: 'AI_RESPONSE_INVALID',
  AI_GENERATION_FAILED: 'AI_GENERATION_FAILED',
  GEMINI_NOT_CONFIGURED: 'GEMINI_NOT_CONFIGURED',
  ANALYSIS_NOT_FOUND: 'ANALYSIS_NOT_FOUND',
  ANALYSIS_PREREQUISITES_MISSING: 'ANALYSIS_PREREQUISITES_MISSING',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;
