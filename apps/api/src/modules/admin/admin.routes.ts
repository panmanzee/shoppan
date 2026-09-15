import { Router } from "express";
import { asyncHandler } from "@/lib/asyncHandler";
import { requireAuth, requireRole } from "@/middleware/auth";
import * as adminController from "./admin.controller";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/stats", asyncHandler(adminController.stats));
