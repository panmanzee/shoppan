import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import * as reviewsController from "./reviews.controller";
import { createReviewSchema } from "./reviews.schema";

// Mounted at the app root (see app.ts) so it can own full paths like
// /products/:id/reviews and /sellers/:id/reviews without fighting the
// productsRouter/sellersRouter's own route matching.
export const reviewsRouter = Router();

reviewsRouter.get("/products/:id/reviews", asyncHandler(reviewsController.getProductReviews));
reviewsRouter.post(
  "/products/:id/reviews",
  requireAuth,
  validate(createReviewSchema),
  asyncHandler(reviewsController.createProductReview)
);

reviewsRouter.get("/sellers/:id/reviews", asyncHandler(reviewsController.getSellerReviews));
reviewsRouter.post(
  "/sellers/:id/reviews",
  requireAuth,
  validate(createReviewSchema),
  asyncHandler(reviewsController.createSellerReview)
);
