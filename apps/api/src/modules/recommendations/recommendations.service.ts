/**
 * Phase 4 recommendation logic. Two entry points:
 *  - getSimilarProducts: "similar products" on a product detail page —
 *    item-based, doesn't care who's asking.
 *  - getRecommendationsForUser: "recommended for you" — personalized to
 *    one buyer's own interaction history.
 *
 * Both are built on the same item-item co-occurrence matrix: how often
 * does product B show up in the same users' interaction history as
 * product A, weighted by how strong each signal was (see constants.ts).
 * This is a simple, explainable stand-in for a real matrix-factorization
 * model (e.g. the `implicit` Python library suggested in
 * PROJECT_INSTRUCTIONS.md) — not viable here since the API is TypeScript/
 * Node, not Python. See README "Phase 4" for the full writeup, including
 * why this was built in-house instead of using AWS Personalize.
 */
import * as recommendationsRepository from "./recommendations.repository";
import * as productsRepository from "@/modules/products/products.repository";
import { RECOMMENDATION_DEFAULT_LIMIT } from "@/config/constants";
import { ApiError } from "@/middleware/errorHandler";

type CoMatrix = Map<string, Map<string, number>>;

// For every user, every pair of products they've both interacted with
// gets a co-occurrence bump proportional to the product of their two
// interaction weights — so a user who bought A and gave B a 5-star
// review contributes more to the A<->B link than a user who just viewed
// both once.
function buildCoOccurrence(byUser: Map<string, Map<string, number>>): CoMatrix {
  const co: CoMatrix = new Map();
  const bump = (a: string, b: string, amount: number) => {
    let row = co.get(a);
    if (!row) {
      row = new Map();
      co.set(a, row);
    }
    row.set(b, (row.get(b) ?? 0) + amount);
  };

  for (const products of byUser.values()) {
    const entries = [...products.entries()];
    for (let i = 0; i < entries.length; i++) {
      for (let j = 0; j < entries.length; j++) {
        if (i === j) continue;
        const [productA, weightA] = entries[i];
        const [productB, weightB] = entries[j];
        bump(productA, productB, weightA * weightB);
      }
    }
  }
  return co;
}

// "Similar products" for a product detail page. Public — doesn't depend
// on who's viewing, just on the product itself.
export async function getSimilarProducts(productId: string, limit = RECOMMENDATION_DEFAULT_LIMIT) {
  const product = await productsRepository.findProductById(productId);
  if (!product) throw ApiError.notFound("Product not found");

  const byUser = await recommendationsRepository.getAllWeightedInteractions();
  const co = buildCoOccurrence(byUser);
  const row = co.get(productId);

  const candidateIds =
    row && row.size > 0
      ? [...row.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([id]) => id)
          .slice(0, limit)
      : [];

  const candidates = candidateIds.length > 0 ? await productsRepository.findProductsByIds(candidateIds) : [];
  const byId = new Map(candidates.filter((p) => p.isActive).map((p) => [p.id, p]));
  const ranked = candidateIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (ranked.length >= limit) return ranked.slice(0, limit);

  // Not enough co-occurrence data yet (new or rarely-interacted-with
  // product) — pad out with same-category products instead of returning
  // a half-empty list.
  const fallback = await recommendationsRepository.getSameCategoryProducts(
    product.categoryId,
    [productId, ...ranked.map((p) => p.id)],
    limit - ranked.length
  );
  return [...ranked, ...fallback];
}

// "Recommended for you" — personalized to one buyer's own interaction
// history. Deliberately exposed as GET /recommendations/me (requireAuth)
// rather than the spec's literal GET /recommendations/:userId — see
// README for why (this is someone's personal interest profile, so it's
// treated with the same ownership check as e.g. subscription cancellation
// in Phase 3, not something readable via an arbitrary URL param).
export async function getRecommendationsForUser(userId: string, limit = RECOMMENDATION_DEFAULT_LIMIT) {
  const byUser = await recommendationsRepository.getAllWeightedInteractions();
  const myInteractions = byUser.get(userId);

  // Cold start: brand-new buyer with zero interaction history yet.
  if (!myInteractions || myInteractions.size === 0) {
    return recommendationsRepository.getPopularProducts(limit);
  }

  const co = buildCoOccurrence(byUser);
  const scores = new Map<string, number>();
  for (const [seedProductId, seedWeight] of myInteractions.entries()) {
    const row = co.get(seedProductId);
    if (!row) continue;
    for (const [candidateId, coScore] of row.entries()) {
      if (myInteractions.has(candidateId)) continue; // don't recommend what they already bought/viewed/reviewed
      scores.set(candidateId, (scores.get(candidateId) ?? 0) + seedWeight * coScore);
    }
  }

  const rankedIds = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .slice(0, limit);

  if (rankedIds.length === 0) {
    return recommendationsRepository.getPopularProducts(limit);
  }

  const products = await productsRepository.findProductsByIds(rankedIds);
  const byId = new Map(products.filter((p) => p.isActive).map((p) => [p.id, p]));
  const ranked = rankedIds.map((id) => byId.get(id)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (ranked.length >= limit) return ranked;

  // Collaborative filtering didn't surface enough candidates — pad with
  // platform-wide popular products, excluding anything they've already
  // interacted with or that's already in the ranked list.
  const popular = await recommendationsRepository.getPopularProducts(limit - ranked.length + myInteractions.size);
  const seen = new Set([...ranked.map((p) => p.id), ...myInteractions.keys()]);
  const padding = popular.filter((p) => !seen.has(p.id)).slice(0, limit - ranked.length);
  return [...ranked, ...padding];
}
