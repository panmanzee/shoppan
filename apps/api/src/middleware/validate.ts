/**
 * Wraps a zod schema into an Express middleware. Put it in front of any
 * route handler to validate/parse `body`, `query`, or `params` before the
 * controller ever runs — the controller can then trust the shape of
 * `req.body` completely.
 *
 * Usage: router.post("/signup", validate(signupSchema), authController.signup)
 */
import { NextFunction, Request, Response } from "express";
import { AnyZodObject, ZodEffects } from "zod";

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Overwrite `body` directly (safe to reassign on Express 4).
    if (result.body) req.body = result.body;
    // `req.query`/`req.params` are getters on some Express versions, so
    // the parsed-and-coerced versions (e.g. "2" -> 2 for page numbers)
    // go on separate properties instead of overwriting them in place.
    if (result.query) req.validatedQuery = result.query;
    if (result.params) req.validatedParams = result.params;
    next();
  };
}
