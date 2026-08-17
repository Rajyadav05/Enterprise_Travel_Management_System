import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { AUTH_COOKIE_NAME, RESPONSE_MESSAGES } from "../utils/constants";
import { type JwtTokenPayload, verifyToken } from "../utils/jwt";

/**
 * Authentication middleware.
 * Verifies JWT token from Authorization header or HTTP-only cookie,
 * verifies user existence and active status in the database, and attaches user to req.user.
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    }

    if (!token) {
      throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
    }

    const decoded = verifyToken<JwtTokenPayload>(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        employee: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw ApiError.forbidden(RESPONSE_MESSAGES.USER_INACTIVE);
    }

    if (user.employee && user.employee.status !== "ACTIVE") {
      throw ApiError.forbidden(RESPONSE_MESSAGES.EMPLOYEE_INACTIVE);
    }

    req.user = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeId: user.employee.employeeId,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            status: user.employee.status,
          }
        : null,
    };

    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Role-based authorization middleware.
 * Checks if the authenticated user has one of the allowed roles.
 * @param allowedRoles List of allowed role names (case-insensitive)
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized(RESPONSE_MESSAGES.UNAUTHORIZED));
    }

    const userRoleName = req.user.role.name.toUpperCase();
    const hasRole = allowedRoles.some(
      (role) => role.toUpperCase() === userRoleName
    );

    if (!hasRole) {
      return next(ApiError.forbidden(RESPONSE_MESSAGES.FORBIDDEN));
    }

    return next();
  };
};
