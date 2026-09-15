import { Request, Response } from "express";
import * as productsService from "./products.service";
import * as productsRepository from "./products.repository";
import * as recommendationsRepository from "@/modules/recommendations/recommendations.repository";
import { logger } from "@/lib/logger";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "./products.schema";

export async function create(req: Request, res: Response) {
  const input = req.body as CreateProductInput;
  const product = await productsService.createProduct(req.user!.id, input);
  res.status(201).json({ product });
}

export async function update(req: Request, res: Response) {
  const input = req.body as UpdateProductInput;
  const product = await productsService.updateProduct(req.user!.id, req.params.id, input);
  res.json({ product });
}

export async function remove(req: Request, res: Response) {
  await productsService.deleteProduct(req.user!.id, req.params.id);
  res.status(204).send();
}

export async function getOne(req: Request, res: Response) {
  const product = await productsService.getProduct(req.params.id);

  // Best-effort "view" signal for the recommendation engine (Phase 4) —
  // only recorded for logged-in visitors (req.user is set by
  // attachUserIfPresent when a valid session cookie is present).
  // Fire-and-forget: a logging failure should never break the product
  // page itself, so this doesn't sit in the request's await chain.
  if (req.user) {
    recommendationsRepository
      .logProductView(req.user.id, product.id)
      .catch((err) => logger.warn({ err }, "Failed to log product view"));
  }

  res.json({ product });
}

export async function list(req: Request, res: Response) {
  const query = req.validatedQuery as unknown as ListProductsQuery;
  const { items, total } = await productsService.listProducts(query);
  res.json({
    products: items,
    pagination: { page: query.page, pageSize: query.pageSize, total },
  });
}

export async function mine(req: Request, res: Response) {
  const sellerProfile = await productsRepository.findSellerProfileByUserId(req.user!.id);
  if (!sellerProfile) {
    return res.json({ products: [] });
  }
  const products = await productsRepository.listProductsBySeller(sellerProfile.id);
  res.json({ products });
}
