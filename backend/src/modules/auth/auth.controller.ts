import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import {
  AUDIT_ACTIONS,
  HTTP_STATUS,
  RESPONSE_MESSAGES,
} from "../../utils/constants";
import { auditService } from "../audit/audit.service";
import { authService } from "./auth.service";
import type { LoginInput, RegisterInput } from "./auth.types";

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
   * Registers a new user and employee record.
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
