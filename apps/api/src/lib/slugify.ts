/**
 * Turns "Willow & Clay Studio" into "willow-clay-studio". Used for seller
 * storefront URLs (/sellers/[slug]) and category URLs.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
