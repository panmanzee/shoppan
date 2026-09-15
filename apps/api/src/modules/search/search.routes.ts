import { Router } from "express";
import { search, backfillEmbeddings } from "./search.controller";

export const searchRouter = Router();

// GET /search?q=handmade+ceramic&page=1&limit=20
searchRouter.get("/search", search);

// POST /search/embeddings/backfill  (admin only — run once to fill vector column)
searchRouter.post("/search/embeddings/backfill", ...backfillEmbeddings);
