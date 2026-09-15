import { prisma } from "@/lib/prisma";

export function findSellerBySlug(slug: string) {
  return prisma.sellerProfile.findUnique({
    where: { slug },
    include: {
      products: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export function listSellers() {
  return prisma.sellerProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { products: { where: { isActive: true } } } },
    },
  });
}
