import type { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "@/lib/asyncHandler";
import { ApiError } from "@/middleware/errorHandler";
import { requireAuth } from "@/middleware/auth";
import * as searchService from "./search.service";

const querySchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const search = asyncHandler(async (req: Request, res: Response) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.errors[0].message);
  }

  const { q, page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const results = await searchService.semanticSearch(q, limit, offset);
  res.json({ results, query: q, page, limit });
});

export const backfillEmbeddings = [
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // Simple admin guard — only ADMIN role can trigger a backfill
    if ((req as any).user?.role !== "ADMIN") {
      throw ApiError.forbidden("Admin only");
    }
    const result = await searchService.backfillEmbeddings();
    res.json(result);
  }),
];
