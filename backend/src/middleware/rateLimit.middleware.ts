import rateLimit from "express-rate-limit";
import { HTTP_STATUS } from "../utils/constants";

/**
 * Global API rate limiter:
 * Limits each IP to approximately 100 requests per 15-minute window.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS ?? 429,
  skip: (req) => {
    // Optionally skip during test execution
    return process.env.NODE_ENV === "test";
  },
});

/**
 * Strict authentication rate limiter for sensitive endpoints (e.g. login):
 * Limits each IP to 5 requests per 15-minute window to mitigate brute-force and credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS ?? 429,
  skip: (req) => {
    return process.env.NODE_ENV === "test";
  },
});
