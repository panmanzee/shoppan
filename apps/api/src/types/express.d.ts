// Extends Express's Request type so `req.user` is type-safe everywhere
// after the `requireAuth` middleware runs, instead of using `any`.
import { Role } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
      // Set by the `validate()` middleware — the zod-parsed (and
      // type-coerced) versions of req.query / req.params.
      validatedQuery?: Record<string, unknown>;
      validatedParams?: Record<string, unknown>;
    }
  }
}

export {};
