/**
 * Centralized error handling. Every route/service throws an `ApiError`
 * (or lets an unexpected error bubble up) and this single middleware
 * turns it into a consistent JSON shape:
 *   { error: { message, code, details? } }
 * so the frontend never has to guess the error format per endpoint.
 */
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static conflict(message: string) {
    return new ApiError(409, "CONFLICT", message);
  }
}

// Must be registered LAST, after all routes — Express recognizes it as
// an error handler because it takes 4 arguments.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.flatten(),
      },
    });
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    error: { message: "Internal server error", code: "INTERNAL_ERROR" },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { message: `No route for ${req.method} ${req.path}`, code: "NOT_FOUND" },
  });
}
