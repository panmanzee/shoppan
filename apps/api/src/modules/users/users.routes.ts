import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth } from "@/middleware/auth";
import { validate } from "@/middleware/validate";
import * as usersController from "./users.controller";
import { becomeSellerSchema, updateSellerProfileSchema } from "./users.schema";

export const usersRouter = Router();

// Every route below requires a valid session cookie.
usersRouter.use(requireAuth);

usersRouter.get("/me", asyncHandler(usersController.me));
usersRouter.post(
  "/me/become-seller",
  validate(becomeSellerSchema),
  asyncHandler(usersController.becomeSeller)
);

usersRouter.patch(
  "/me/seller-profile",
  validate(updateSellerProfileSchema),
  asyncHandler(usersController.updateSellerProfile)
);
