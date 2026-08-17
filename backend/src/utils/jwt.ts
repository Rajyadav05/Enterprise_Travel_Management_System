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
 * Generates a signed JWT token with the provided payload.
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
