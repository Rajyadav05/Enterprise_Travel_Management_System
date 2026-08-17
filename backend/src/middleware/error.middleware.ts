import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { ApiError } from "../utils/ApiError";
import { HTTP_STATUS, RESPONSE_MESSAGES } from "../utils/constants";
import { formatZodErrors } from "./validate.middleware";

/**
 * 404 Not Found middleware for unmatched routes.
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(
    ApiError.notFound(
      `Cannot ${req.method} ${req.originalUrl} - Route not found on ETMS server`
    )
  );
};

/**
 * Global centralized error handling middleware.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message: string = RESPONSE_MESSAGES.INTERNAL_ERROR;
  let errors: unknown[] = [];
  let isOperational = false;
  let stack: string | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    isOperational = err.isOperational;
    stack = err.stack;
  } else if (err instanceof ZodError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Request validation failed";
    errors = formatZodErrors(err);
    isOperational = true;
    stack = err.stack;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    isOperational = true;
    stack = err.stack;

    switch (err.code) {
      case "P2002": {
        statusCode = HTTP_STATUS.CONFLICT;
        const target = Array.isArray(err.meta?.target)
          ? err.meta.target.join(", ")
          : (err.meta?.target as string) || "field";
        message = `Unique constraint violation: A record with this ${target} already exists`;
        break;
      }
      case "P2025": {
        statusCode = HTTP_STATUS.NOT_FOUND;
        message = (err.meta?.cause as string) || "Record not found in database";
        break;
      }
      case "P2003": {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = "Foreign key constraint failed on related entity";
        break;
      }
      default: {
        statusCode = HTTP_STATUS.BAD_REQUEST;
        message = "Database operation failed";
        break;
      }
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid database query payload";
    isOperational = true;
    stack = err.stack;
  } else if (err instanceof SyntaxError && "body" in err) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Malformed JSON body in request";
    isOperational = true;
    stack = err.stack;
  } else if (err instanceof Error) {
    message = err.message;
    stack = err.stack;
  }

  // Log error with appropriate severity
  if (isOperational) {
    logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`, {
      ip: req.ip,
      errors: errors.length > 0 ? errors : undefined,
    });
  } else {
    logger.error(`[${req.method}] ${req.originalUrl} - Unhandled Exception: ${message}`, err, {
      ip: req.ip,
    });
  }

  // Hide internal server error messages in production if not operational
  const clientMessage =
    env.NODE_ENV === "production" && !isOperational
      ? RESPONSE_MESSAGES.INTERNAL_ERROR
      : message;

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(errors.length > 0 ? { errors } : {}),
    ...(env.NODE_ENV !== "production" && stack ? { stack } : {}),
  });
};
