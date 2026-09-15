import { prisma } from "@/lib/prisma";
import { PlanAudience } from "@prisma/client";

export function findPlansByAudience(audience: PlanAudience) {
  return prisma.plan.findMany({
    where: { audience },
    orderBy: { priceCents: "asc" },
  });
}
