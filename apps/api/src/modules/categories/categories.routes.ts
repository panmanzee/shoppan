import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import * as categoriesController from "./categories.controller";

export const categoriesRouter = Router();

// Public — powers the category filter chips on the frontend catalog page.
categoriesRouter.get("/", asyncHandler(categoriesController.list));
