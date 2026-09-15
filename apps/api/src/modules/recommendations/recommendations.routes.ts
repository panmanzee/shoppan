import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import * as recommendationsController from "./recommendations.controller";

export const recommendationsRouter = Router();

// Mounted at the app root (like reviewsRouter) so it can own
// /products/:id/similar, a path that belongs under the products prefix
// but is implemented in this module.
recommendationsRouter.get("/products/:id/similar", asyncHandler(recommendationsController.similar));

// "Recommended for you" is a personal interest profile, not public data —
// requireAuth + always reads from the caller's own session, never a URL
// param (see recommendations.service.ts comment for why this differs
// from PROJECT_INSTRUCTIONS.md's literal GET /recommendations/:userId).
recommendationsRouter.get("/recommendations/me", requireAuth, asyncHandler(recommendationsController.mine));
