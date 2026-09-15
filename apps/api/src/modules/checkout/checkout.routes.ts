import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import * as checkoutController from "./checkout.controller";
import { checkoutSchema } from "./checkout.schema";

export const checkoutRouter = Router();

checkoutRouter.post(
  "/",
  requireAuth,
  validate(checkoutSchema),
  asyncHandler(checkoutController.checkout)
);
