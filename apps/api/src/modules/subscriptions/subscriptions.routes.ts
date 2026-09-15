import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import * as subscriptionsController from "./subscriptions.controller";
import { cancelSubscriptionSchema, subscribeSchema } from "./subscriptions.schema";

export const subscriptionsRouter = Router();

subscriptionsRouter.post(
  "/",
  requireAuth,
  validate(subscribeSchema),
  asyncHandler(subscriptionsController.subscribe)
);

subscriptionsRouter.get("/me", requireAuth, asyncHandler(subscriptionsController.mine));

subscriptionsRouter.post(
  "/:id/cancel",
  requireAuth,
  validate(cancelSubscriptionSchema),
  asyncHandler(subscriptionsController.cancel)
);
