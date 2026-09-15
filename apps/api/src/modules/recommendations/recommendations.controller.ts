import { Request, Response } from "express";
import * as recommendationsService from "./recommendations.service";
import { RECOMMENDATION_DEFAULT_LIMIT } from "@/config/constants";

export async function similar(req: Request, res: Response) {
  const products = await recommendationsService.getSimilarProducts(req.params.id, RECOMMENDATION_DEFAULT_LIMIT);
  res.json({ products });
}

export async function mine(req: Request, res: Response) {
  const products = await recommendationsService.getRecommendationsForUser(req.user!.id, RECOMMENDATION_DEFAULT_LIMIT);
  res.json({ products });
}
