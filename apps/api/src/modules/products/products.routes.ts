import { Router } from "express";
import { Role } from "@prisma/client";
import { asyncHandler } from "@/lib/asyncHandler";
import { attachUserIfPresent, requireAuth, requireRole } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import * as productsController from "./products.controller";
import { createProductSchema, listProductsSchema, updateProductSchema } from "./products.schema";

export const productsRouter = Router();

// --- Public: browse the catalog ---
productsRouter.get("/", validate(listProductsSchema), asyncHandler(productsController.list));

// --- Seller: list own active products (must be before /:id to avoid conflict) ---
productsRouter.get(
  "/mine",
  requireAuth,
  requireRole(Role.SELLER, Role.ADMIN),
  asyncHandler(productsController.mine)
);

// attachUserIfPresent (not requireAuth) — still public, but lets getOne
// log a view for the recommendation engine when the visitor happens to
// be logged in, without blocking anonymous visitors.
productsRouter.get("/:id", attachUserIfPresent, asyncHandler(productsController.getOne));

// --- Seller-only: manage your own listings ---
productsRouter.post(
  "/",
  requireAuth,
  requireRole(Role.SELLER, Role.ADMIN),
  validate(createProductSchema),
  asyncHandler(productsController.create)
);
productsRouter.patch(
  "/:id",
  requireAuth,
  requireRole(Role.SELLER, Role.ADMIN),
  validate(updateProductSchema),
  asyncHandler(productsController.update)
);
productsRouter.delete(
  "/:id",
  requireAuth,
  requireRole(Role.SELLER, Role.ADMIN),
  asyncHandler(productsController.remove)
);
