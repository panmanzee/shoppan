# Kindred — Frontend Preview

This is the visual frontend for **Kindred**, the hybrid marketplace +
subscription platform described in `../../PROJECT_INSTRUCTIONS.md`.

**Status:** this is a Phase-1-style frontend preview — every page is built
with mock data and a working in-memory cart (React Context), but there is
no backend yet. Nothing here is wired to a real database, auth, or Stripe.
That comes next per the phases in `PROJECT_INSTRUCTIONS.md`.

## Pages included

- `/` — landing page
- `/products` — catalog with category filter
- `/products/[id]` — product detail page (add to cart works)
- `/sellers/[id]` — seller storefront
- `/cart` — cart grouped by seller
- `/checkout` — demo checkout form
- `/login`, `/signup` — auth screens (signup has buyer/seller toggle)
- `/pricing` — buyer + seller subscription plans (toggle)
- `/dashboard/buyer` — buyer order history + membership
- `/dashboard/seller` — seller sales chart + listings

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Notes

- Product photos are placeholder images from picsum.photos, not real assets.
- The design draws on common marketplace layout *patterns* (card grids,
  storefront headers, tiered pricing tables) — no brand logos, copy, or
  proprietary visual assets were copied from any real company.
