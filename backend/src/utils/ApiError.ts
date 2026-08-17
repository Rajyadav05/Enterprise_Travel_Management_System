import { HTTP_STATUS, type HttpStatusCode } from "./constants";

export class ApiError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly errors: unknown[];

  constructor(
    statusCode: HttpStatusCode,
    message: string,
    errors: unknown[] = [],
    isOperational = true,
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public static badRequest(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, errors);
  }

  public static unauthorized(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, errors);
  }

  public static forbidden(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, errors);
  }

  public static notFound(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, errors);
  }

  public static conflict(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(HTTP_STATUS.CONFLICT, message, errors);
  }

  public static unprocessable(message: string, errors: unknown[] = []): ApiError {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, errors);
  }

  public static internal(
    message = "Internal Server Error",
    errors: unknown[] = []
  ): ApiError {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, errors, false);
  }
}
