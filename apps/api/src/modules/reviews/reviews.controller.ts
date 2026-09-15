import { Request, Response } from "express";
import * as reviewsService from "./reviews.service";
import type { CreateReviewInput } from "./reviews.schema";

export async function createProductReview(req: Request, res: Response) {
  const input = req.body as CreateReviewInput;
  const review = await reviewsService.addProductReview(req.params.id, req.user!.id, input);
  res.status(201).json({ review });
}

export async function getProductReviews(req: Request, res: Response) {
  const reviews = await reviewsService.listProductReviews(req.params.id);
  res.json({ reviews });
}

export async function createSellerReview(req: Request, res: Response) {
  const input = req.body as CreateReviewInput;
  const review = await reviewsService.addSellerReview(req.params.id, req.user!.id, input);
  res.status(201).json({ review });
}

export async function getSellerReviews(req: Request, res: Response) {
  const reviews = await reviewsService.listSellerReviews(req.params.id);
  res.json({ reviews });
}
