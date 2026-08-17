import type { NextFunction, Request, Response } from "express";
import { type ZodError, type ZodSchema } from "zod";
import { ApiError } from "../utils/ApiError";

export interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export const formatZodErrors = (error: ZodError): ValidationErrorDetail[] => {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));
};

/**
 * Middleware to validate request body, query, or params against Zod schemas.
 * Throws a 400 Bad Request ApiError if validation fails.
 */
export const validate = (schema: ZodSchema | RequestValidationSchemas) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ("parse" in schema && typeof schema.parse === "function") {
        // Direct body schema
        req.body = await schema.parseAsync(req.body);
        return next();
      }

      const schemas = schema as RequestValidationSchemas;

      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as Request["query"];
      }
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as Request["params"];
      }

      return next();
    } catch (error) {
      if (typeof error === "object" && error !== null && "issues" in error) {
        const zodError = error as ZodError;
        const details = formatZodErrors(zodError);
        return next(
          ApiError.badRequest(
            details[0]?.message ?? "Validation failed on incoming request data",
            details
          )
        );
      }
      return next(error);
    }
  };
};
