import { Request, Response } from "express";
import { PlanAudience } from "@prisma/client";
import * as plansRepository from "./plans.repository";

export async function list(req: Request, res: Response) {
  const audience = req.query.audience as PlanAudience;
  const plans = await plansRepository.findPlansByAudience(audience);
  res.json({ plans });
}
