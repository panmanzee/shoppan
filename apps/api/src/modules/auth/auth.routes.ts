import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { authLimiter } from "@/middleware/rateLimit";
import { validate } from "@/middleware/validate";
import * as authController from "./auth.controller";
import { loginSchema, signupSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.post(
  "/signup",
  authLimiter,
  validate(signupSchema),
  asyncHandler(authController.signup)
);
authRouter.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login)
);
authRouter.post("/logout", asyncHandler(authController.logout));
