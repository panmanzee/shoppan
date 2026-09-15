import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import * as sellersController from "./sellers.controller";

export const sellersRouter = Router();

// List all sellers — GET /sellers
sellersRouter.get("/", asyncHandler(sellersController.list));

// Public storefront page — GET /sellers/willow-clay-studio
sellersRouter.get("/:slug", asyncHandler(sellersController.getBySlug));
