import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { validate } from "@/middleware/validate";
import * as plansController from "./plans.controller";
import { listPlansSchema } from "./plans.schema";

export const plansRouter = Router();

// Public route — anyone (even logged out) can see pricing.
// GET /plans?audience=BUYER or ?audience=SELLER
plansRouter.get("/", validate(listPlansSchema), asyncHandler(plansController.list));
