import rateLimit from "express-rate-limit";
import { env } from "@config/env";
import { ApiError } from "@utils/ApiError";

function rateLimitHandler(): never {
  throw ApiError.tooManyRequests("Too many requests, please try again later.");
}

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/** Stricter limiter applied only to auth endpoints (login/signup) to slow brute force. */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
