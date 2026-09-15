import { Request, Response } from "express";
import { ApiError } from "@/middleware/errorHandler";
import * as sellersRepository from "./sellers.repository";

export async function list(req: Request, res: Response) {
  const sellers = await sellersRepository.listSellers();
  res.json({ sellers });
}

export async function getBySlug(req: Request, res: Response) {
  const seller = await sellersRepository.findSellerBySlug(req.params.slug);
  if (!seller) {
    throw ApiError.notFound("Seller not found");
  }
  res.json({ seller });
}
