import { Request, Response } from "express";
import * as categoriesRepository from "./categories.repository";

export async function list(req: Request, res: Response) {
  const categories = await categoriesRepository.findAllCategories();
  res.json({ categories });
}
