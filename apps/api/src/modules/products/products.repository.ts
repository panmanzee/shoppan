import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import * as subscriptionsRepository from "@/modules/subscriptions/subscriptions.repository";

export function findCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export function findSellerProfileByUserId(userId: string) {
  return prisma.sellerProfile.findUnique({ where: { userId } });
}

export function createProduct(data: {
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  priceCents: number;
  imageUrl?: string;
  stock: number;
}) {
  return prisma.product.create({ data });
}

export function findProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { seller: true, category: true },
  });
}

export function updateProduct(id: string, data: Prisma.ProductUpdateInput) {
  return prisma.product.update({ where: { id }, data });
}

export function deleteProduct(id: string) {
  return prisma.product.delete({ where: { id } });
}

interface ListProductsFilters {
  categorySlug?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  page: number;
  pageSize: number;
}

export async function listActiveProducts(filters: ListProductsFilters) {
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.minPriceCents !== undefined || filters.maxPriceCents !== undefined
      ? {
          priceCents: {
            ...(filters.minPriceCents !== undefined ? { gte: filters.minPriceCents } : {}),
            ...(filters.maxPriceCents !== undefined ? { lte: filters.maxPriceCents } : {}),
          },
        }
      : {}),
  };

  // Phase 3 perk: sellers on a plan with a `searchBoost` perk (e.g. the
  // Pro tier) get ranked above free-tier sellers, all else equal. This
  // ranks in application code rather than a DB `ORDER BY` because the
  // boost value lives in a sibling table's JSON `perks` field — fine at
  // this catalog size; Phase 5 (semantic search) is where this becomes
  // a proper ranking query instead.
  const all = await prisma.product.findMany({
    where,
    include: { seller: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  const sellerUserIds = [...new Set(all.map((p) => p.seller.userId))];
  const sellerSubscriptions = await subscriptionsRepository.findActiveSellerSubscriptions(sellerUserIds);
  const boostByUserId = new Map<string, number>();
  for (const sub of sellerSubscriptions) {
    const perks = sub.plan.perks as { searchBoost?: number };
    if (perks.searchBoost) {
      boostByUserId.set(sub.userId, perks.searchBoost);
    }
  }

  const sorted = [...all].sort((a, b) => {
    const boostA = boostByUserId.get(a.seller.userId) ?? 0;
    const boostB = boostByUserId.get(b.seller.userId) ?? 0;
    if (boostA !== boostB) return boostB - boostA; // higher boost first
    return b.createdAt.getTime() - a.createdAt.getTime(); // then newest first
  });

  const total = sorted.length;
  const start = (filters.page - 1) * filters.pageSize;
  const items = sorted.slice(start, start + filters.pageSize);

  return { items, total };
}

export function listProductsBySeller(sellerId: string) {
  return prisma.product.findMany({
    where: { sellerId, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

// Used by checkout (cart lookups) and recommendations.service.ts
// (similar/recommended product lookups) — fetches many products in one
// query instead of N round trips. Includes `seller` (with its `userId`,
// needed by checkout for the seller's active subscription/commission
// perk) and `category` (needed by recommendations, so results have the
// same shape as every other product list endpoint).
export function findProductsByIds(ids: string[]) {
  return prisma.product.findMany({
    where: { id: { in: ids } },
    include: { seller: true, category: true },
  });
}
