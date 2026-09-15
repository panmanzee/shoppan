import { prisma } from "@/lib/prisma";

export function findAllCategories() {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}
