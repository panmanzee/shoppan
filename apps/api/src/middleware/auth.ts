/**
 * Reads the JWT from the httpOnly session cookie (never from
 * localStorage/Authorization header — that's what makes it XSS-resistant),
 * verifies it, and attaches `{ id, role }` to `req.user`.
 *
 * - `requireAuth`: blocks the request with 401 if there's no valid session.
 * - `requireRole(...roles)`: blocks with 403 if the logged-in user's role
 *   isn't in the allowed list. Compose after requireAuth.
 */
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "@/config/env";
import { ApiError } from "./errorHandler";

interface SessionPayload {
  sub: string;
  role: Role;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.COOKIE_NAME];

  if (!token) {
    return next(ApiError.unauthorized("You must be logged in"));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as SessionPayload;
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized("Session expired or invalid, please log in again"));
  }
}

/**
 * Like `requireAuth`, but never blocks the request — it just attaches
 * `req.user` if a valid session cookie is present, and silently leaves it
 * undefined otherwise. Used on routes that are public but behave slightly
 * differently for logged-in users (e.g. logging a product view for the
 * recommendation engine only when we know who's viewing).
 */
export function attachUserIfPresent(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as SessionPayload;
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // Invalid/expired token on a public route — just treat as logged out
    // instead of failing the request.
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You don't have permission to do that"));
    }
    next();
  };
}
