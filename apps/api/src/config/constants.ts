/**
 * Values that multiple modules need to agree on. Keeping them here
 * (instead of copy-pasted magic numbers) means changing the commission
 * rate is a one-line edit, not a find-and-replace across the codebase.
 */

// Flat platform commission for Phase 2. Matches the seller "Starter"
// plan's `commissionPercent` in prisma/seed.ts. Phase 3 will make this
// subscription-aware (Pro sellers pay 6% instead of 12%) by reading the
// seller's active Subscription instead of using this constant directly.
export const DEFAULT_COMMISSION_PERCENT = 12;

// ---------- Phase 4: recommendations ----------
// Relative weight of each interaction signal when building the item-item
// co-occurrence matrix and a user's own interest profile. A purchase is
// the strongest signal of genuine interest, a positive rating is next,
// a view is the weakest (weakest signal-to-noise — people click around).
export const RECOMMENDATION_PURCHASE_WEIGHT = 3;
export const RECOMMENDATION_RATING_WEIGHT = 2;
// Only ratings at/above this count as a positive signal for "this buyer
// likes this kind of product" — a 1-star review shouldn't feed the
// recommender the same way a 5-star one does.
export const RECOMMENDATION_POSITIVE_RATING_THRESHOLD = 4;
export const RECOMMENDATION_VIEW_WEIGHT = 1;
export const RECOMMENDATION_DEFAULT_LIMIT = 8;
