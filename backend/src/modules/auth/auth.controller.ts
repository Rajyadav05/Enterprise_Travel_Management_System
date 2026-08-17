import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../../utils/constants";
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
