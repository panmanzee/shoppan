import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import * as ordersController from "./orders.controller";

export const ordersRouter = Router();

ordersRouter.use(requireAuth);

// Buyer's own purchase history.
ordersRouter.get("/mine", asyncHandler(ordersController.mine));
// Seller's own sales — every order that contains one of their listings.
ordersRouter.get("/selling", asyncHandler(ordersController.selling));
// Seller marks an order as fulfilled
ordersRouter.patch("/:id/fulfill", asyncHandler(ordersController.fulfill));
