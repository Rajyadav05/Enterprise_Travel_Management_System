import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  AUDIT_ACTIONS,
  AUTH_COOKIE_NAME,
  HTTP_STATUS,
  REFRESH_COOKIE_NAME,
  RESPONSE_MESSAGES,
} from "../../utils/constants";
import { auditService } from "../audit/audit.service";
import { authService } from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.types";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: (env.NODE_ENV === "production" ? "strict" : "lax") as "strict" | "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

export class AuthController {
  /**
   * Handles user login via email or employeeId.
   */
  public async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input: LoginInput = req.body;
      const result = await authService.login(input);

      if (result.refreshToken) {
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);
      }

      void auditService.createAuditLog({
        actorUserId: result.user.id,
        actorEmployeeId: result.employee?.id ?? null,
        action: AUDIT_ACTIONS.USER_LOGIN,
        entityType: "User",
        entityId: result.user.id,
        metadata: {
          email: result.user.email,
          employeeId: result.employee?.employeeId ?? null,
        },
        ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
        userAgent: req.get("user-agent") ?? null,
      });

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.LOGIN_SUCCESS,
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rotates refresh token and issues a new short-lived access token.
   */
  public async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawRefreshToken =
        (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ||
        (req.body?.refreshToken as string | undefined);

      if (!rawRefreshToken) {
        throw ApiError.unauthorized("Refresh token is required.");
      }

      const result = await authService.refreshToken(rawRefreshToken);

      if (result.refreshToken) {
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);
      }

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        "Token refreshed successfully",
        result
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logs out user, revokes session, and clears authentication cookies.
   */
  public async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const rawRefreshToken =
        (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ||
        (req.body?.refreshToken as string | undefined);

      await authService.logout(rawRefreshToken);

      res.clearCookie(REFRESH_COOKIE_NAME, { path: "/" });
      res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });

      if (req.user?.id) {
        void auditService.createAuditLog({
          actorUserId: req.user.id,
          actorEmployeeId: req.user.employee?.id ?? null,
          action: AUDIT_ACTIONS.USER_LOGOUT,
          entityType: "User",
          entityId: req.user.id,
          ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
          userAgent: req.get("user-agent") ?? null,
        });
      }

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.LOGOUT_SUCCESS,
        null
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves profile details for the authenticated user.
   */
  public async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
      }

      const profile = await authService.getProfile(req.user.id);

      ApiResponse.send(
        res,
        HTTP_STATUS.OK,
        RESPONSE_MESSAGES.PROFILE_FETCH_SUCCESS,
        profile
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Registers a new user and employee record (Admin only).
   */
  public async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input: RegisterInput = req.body;
      const result = await authService.register(input);

      ApiResponse.send(
        res,
        HTTP_STATUS.CREATED,
        RESPONSE_MESSAGES.REGISTER_SUCCESS,
        result
      );
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

