/**
 * Express 4 does NOT automatically catch rejected promises from async
 * route handlers — an unhandled rejection would just hang the request.
 * Wrap every async controller with this so thrown/rejected errors reach
 * `errorHandler` via `next(err)` automatically.
 */
import { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
