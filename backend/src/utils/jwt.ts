import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "./ApiError";
import { RESPONSE_MESSAGES } from "./constants";

export interface JwtTokenPayload {
  userId: string;
  role: string;
  roleId: string;
  employeeId?: string;
}

/**
 * Generates a signed JWT access token with the provided payload.
 */
export const generateToken = (
  payload: JwtTokenPayload,
  expiresIn: string = env.JWT_EXPIRES_IN
): string => {
  const options: SignOptions = {
    expiresIn: expiresIn as unknown as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

/**
 * Verifies and decodes a JWT token.
 * Throws ApiError.unauthorized if the token is invalid or expired.
 */
export const verifyToken = <T extends object = JwtTokenPayload>(token: string): T => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return decoded as T;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized(RESPONSE_MESSAGES.TOKEN_EXPIRED);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized(RESPONSE_MESSAGES.TOKEN_INVALID);
    }
    throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
  }
};

/**
 * Generates a cryptographically random, unguessable refresh token string.
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString("hex");
};

/**
 * Computes a SHA-256 hash of a raw token string for safe server-side storage.
 */
export const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Computes the expiration Date for a refresh token based on duration string (e.g. '7d', '24h').
 */
export const computeRefreshTokenExpiry = (durationStr: string = env.REFRESH_TOKEN_EXPIRES_IN): Date => {
  const match = durationStr.match(/^(\d+)([smhd])$/);
  const now = Date.now();
  if (!match) {
    // Default to 7 days
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2];

  let ms = 7 * 24 * 60 * 60 * 1000;
  if (unit === "s") ms = value * 1000;
  else if (unit === "m") ms = value * 60 * 1000;
  else if (unit === "h") ms = value * 60 * 60 * 1000;
  else if (unit === "d") ms = value * 24 * 60 * 60 * 1000;

  return new Date(now + ms);
};

