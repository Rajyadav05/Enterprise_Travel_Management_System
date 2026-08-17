import type { Response } from "express";
import { HTTP_STATUS, type HttpStatusCode } from "./constants";

export interface ApiResponsePayload<T> {
  success: boolean;
  message: string;
  data?: T;
}

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data?: T;

  constructor(message: string, data?: T) {
    this.success = true;
    this.message = message;
    if (data !== undefined) {
      this.data = data;
    }
  }

  public static send<T>(
    res: Response,
    statusCode: HttpStatusCode,
    message: string,
    data?: T
  ): Response {
    const payload: ApiResponsePayload<T> = {
      success: statusCode >= 200 && statusCode < 300,
      message,
    };

    if (data !== undefined) {
      payload.data = data;
    }

    return res.status(statusCode).json(payload);
  }

  public static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: HttpStatusCode = HTTP_STATUS.OK
  ): Response {
    return ApiResponse.send(res, statusCode, message, data);
  }

  public static created<T>(
    res: Response,
    message: string,
    data?: T
  ): Response {
    return ApiResponse.send(res, HTTP_STATUS.CREATED, message, data);
  }
}
