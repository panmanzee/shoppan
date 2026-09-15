/**
 * Data access for the recommendation engine (Phase 4). Combines three
 * interaction signals per PROJECT_INSTRUCTIONS.md — purchase history
 * (OrderItem, already existed), ratings (ProductReview, already existed),
 * and view history (ProductView, new this phase) — into one weighted
 * per-user interaction map that recommendations.service.ts turns into an
 * item-item co-occurrence matrix.
 */
import { prisma } from "@/lib/prisma";
import {
  RECOMMENDATION_POSITIVE_RATING_THRESHOLD,
  RECOMMENDATION_PURCHASE_WEIGHT,
  RECOMMENDATION_RATING_WEIGHT,
  RECOMMENDATION_VIEW_WEIGHT,
} from "@/config/constants";

// userId -> productId -> weight. Fetched fresh per request rather than
// cached — fine at portfolio scale (see README "Known simplifications").
// At real scale this matrix would be precomputed by a background job
// (BullMQ, Phase 7) instead of recomputed on every request.
export type WeightedInteractions = Map<string, Map<string, number>>;

export async function getAllWeightedInteractions(): Promise<WeightedInteractions> {
  const [orderItems, positiveReviews, views] = await Promise.all([
    prisma.orderItem.findMany({
      select: { productId: true, order: { select: { buyerId: true } } },
    }),
    prisma.productReview.findMany({
      where: { rating: { gte: RECOMMENDATION_POSITIVE_RATING_THRESHOLD } },
      select: { productId: true, authorId: true },
    }),
    prisma.productView.findMany({
      select: { productId: true, userId: true },
    }),
  ]);

  const byUser: WeightedInteractions = new Map();

  function addWeight(userId: string, productId: string, weight: number) {
    let products = byUser.get(userId);
    if (!products) {
      products = new Map();
      byUser.set(userId, products);
    }
    products.set(productId, (products.get(productId) ?? 0) + weight);
  }

  for (const item of orderItems) {
    addWeight(item.order.buyerId, item.productId, RECOMMENDATION_PURCHASE_WEIGHT);
  }
  for (const review of positiveReviews) {
    addWeight(review.authorId, review.productId, RECOMMENDATION_RATING_WEIGHT);
  }
  for (const view of views) {
    addWeight(view.userId, view.productId, RECOMMENDATION_VIEW_WEIGHT);
  }

  return byUser;
}

export function logProductView(userId: string, productId: string) {
  return prisma.productView.create({ data: { userId, productId } });
}

// Cold-start fallback for a brand-new user with zero interaction history,
// or padding when collaborative filtering doesn't surface enough
// candidates yet: platform-wide popularity by purchase count, falling
// back further to "newest active listings" if there are no orders yet
// at all (e.g. a completely fresh database).
export async function getPopularProducts(limit: number) {
  if (limit <= 0) return [];

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit * 2, // overfetch — some may turn out inactive below
  });

  if (grouped.length === 0) {
    return prisma.product.findMany({
      where: { isActive: true },
      include: { seller: true, category: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  const ids = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    include: { seller: true, category: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, limit);
}

// Content-based fallback for "similar products" when a product has no
// (or too little) co-occurrence data yet — same category, newest first.
export function getSameCategoryProducts(categoryId: string, excludeIds: string[], limit: number) {
  if (limit <= 0) return Promise.resolve([]);
  return prisma.product.findMany({
    where: { categoryId, isActive: true, id: { notIn: excludeIds } },
    include: { seller: true, category: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
