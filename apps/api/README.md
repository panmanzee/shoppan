# Kindred API — Phase 1 + 2 + 3 + 4 (Foundation + Marketplace + Subscriptions + Recommendations)

This is the backend for the Kindred marketplace. It currently implements
**Phase 1** (auth + core schema), **Phase 2** (product CRUD, seller
storefronts, reviews, multi-seller cart checkout, order history),
**Phase 3** (buyer/seller subscription tiers, with perks actually
enforced in checkout and product ranking), and **Phase 4** (AI Feature 1:
a self-built recommendation engine — "recommended for you" and "similar
products") from `PROJECT_INSTRUCTIONS.md`.

Two things are intentionally stubbed/placeholder for now, per explicit
scope decision, and are called out again in "Known placeholders" below:
product images are plain URLs (no S3 upload yet), and both payments and
billing are stubs that always "succeed" (no real Stripe account yet).

## Run it locally

1. Start Postgres (from the repo root, one level up from `apps/api`):
   ```
   docker compose up -d
   ```
2. Install dependencies:
   ```
   cd apps/api
   npm install
   ```
3. Copy the env file and fill in a real `JWT_SECRET`:
   ```
   cp .env.example .env
   ```
4. Apply the Prisma schema to the database. **Run this again even if
   you did before** — this phase added a new `ProductView` model (the
   "view history" signal for recommendations):
   ```
   npm run prisma:migrate
   ```
5. Seed subscription plans + product categories:
   ```
   npm run prisma:seed
   ```
6. Start the dev server (auto-restarts on file changes):
   ```
   npm run dev
   ```
   The API listens on `http://localhost:4000`.

## Endpoints so far

| Method | Path | Auth required | Description |
|---|---|---|---|
| GET  | `/health` | no | Liveness check |
| POST | `/auth/signup` | no | Create a buyer or seller account, sets session cookie |
| POST | `/auth/login` | no | Log in, sets session cookie |
| POST | `/auth/logout` | no | Clears the session cookie |
| GET  | `/users/me` | yes | Current user + seller profile if any |
| POST | `/users/me/become-seller` | yes | Adds a `SellerProfile` to the current user and upgrades their role |
| GET  | `/plans?audience=BUYER\|SELLER` | no | List subscription plans for buyers or sellers |
| GET  | `/categories` | no | List all product categories |
| GET  | `/products?categoryId=&minPrice=&maxPrice=&page=&pageSize=` | no | Browse/filter/paginate the active product catalog (Pro-tier sellers rank first) |
| GET  | `/products/:id` | no | Get one active product |
| POST | `/products` | yes (seller/admin) | Create a product under your own seller profile |
| PATCH | `/products/:id` | yes (owner seller/admin) | Update your own product |
| DELETE | `/products/:id` | yes (owner seller/admin) | Delete your own product |
| GET  | `/sellers/:slug` | no | Public storefront: seller profile + their active products |
| GET  | `/products/:id/reviews` | no | List reviews for a product |
| POST | `/products/:id/reviews` | yes | Leave a review for a product (one per person) |
| GET  | `/sellers/:id/reviews` | no | List reviews for a seller |
| POST | `/sellers/:id/reviews` | yes | Leave a review for a seller (one per person) |
| POST | `/checkout` | yes | Checkout your cart — splits into one Order per seller, applies perks |
| GET  | `/orders/mine` | yes | Your order history as a buyer |
| GET  | `/orders/selling` | yes (seller) | Orders placed against your storefront |
| POST | `/subscriptions` | yes | Subscribe to a plan (auto-cancels your old plan in the same audience) |
| GET  | `/subscriptions/me` | yes | Your subscription history (active + past) |
| POST | `/subscriptions/:id/cancel` | yes | Cancel one of your own subscriptions |
| GET  | `/products/:id/similar` | no | "Similar products" — item-based collaborative filtering off product `:id` |
| GET  | `/recommendations/me` | yes | "Recommended for you" — personalized to your own purchase/rating/view history |

### Checkout request shape

```json
POST /checkout
{
  "items": [
    { "productId": "abc123", "quantity": 2 },
    { "productId": "xyz789", "quantity": 1 }
  ]
}
```

If the cart contains items from two different sellers, the response
contains **two** `Order` objects — one per seller — each with
`subtotalCents` (list price), `discountCents` (buyer's perk, if any),
`commissionCents`, and `sellerPayoutCents`.

### Subscribe request shape

```json
POST /subscriptions
{ "planId": "cl123..." }
```

Get a plan's ID from `GET /plans?audience=BUYER` or `?audience=SELLER`
first — there's no "subscribe by slug" shortcut on purpose, since a real
client would always list plans before letting the user pick one.

## How Phase 3 perks actually change behavior (not just a pricing page)

- **Buyer discount**: if the buyer has an ACTIVE subscription to a BUYER
  plan with a `discountPercent` perk (the seeded "Kindred+" plan has
  10%), every seller's subtotal in their cart gets that % knocked off at
  checkout — see `discountCents` on each `Order`.
- **Seller commission**: if a seller has an ACTIVE subscription to a
  SELLER plan with a `commissionPercent` perk (the seeded "Pro" plan has
  6% vs. the 12% platform default), their orders use that lower rate
  instead of `DEFAULT_COMMISSION_PERCENT` — see `commissionCents` on
  each `Order`.
- **Search boost**: if a seller has an ACTIVE subscription to a SELLER
  plan with a `searchBoost` perk, their products are ranked above
  non-boosted sellers' products (all else equal) in `GET /products`.

All three are implemented in `checkout.service.ts` and
`products.repository.ts` — read the comments there for exactly how the
math and ranking work.

## How Phase 4 recommendations work

**Algorithm — item-based collaborative filtering via a weighted
co-occurrence matrix**, not matrix factorization. `PROJECT_INSTRUCTIONS.md`
suggests starting with a matrix-factorization library like `implicit`,
which is Python-only — this API is Node/TypeScript, so instead
`recommendations.service.ts` builds an item-item co-occurrence matrix
in-house: for every user, every pair of products they've interacted with
gets a co-occurrence "bump" proportional to the product of the two
interaction weights, so two products both purchased (or purchased +
highly rated) by the same people end up strongly linked. This is a
simpler, more explainable algorithm than matrix factorization, and was a
deliberate choice to demonstrate understanding of the underlying
collaborative-filtering concept rather than just calling a library.
(AWS Personalize was evaluated as a managed alternative and rejected for
the same reason — the point of this phase is proving the algorithm is
understood, not outsourcing it.)

**Signals** (combined into one weighted per-user interaction map by
`recommendations.repository.ts`, weights in `config/constants.ts`):
purchase history (`OrderItem`, weight 3), positive ratings (`ProductReview`
with `rating >= 4`, weight 2), and view history (new `ProductView` model
this phase, weight 1 — only logged for authenticated visitors via the new
`attachUserIfPresent` middleware; anonymous view tracking would need
session/device fingerprinting, out of scope).

**Two endpoints, two use cases:**
- `GET /products/:id/similar` — public, item-based: ranks other products
  by co-occurrence strength with `:id`. Falls back to same-category
  products when a product has too little (or no) interaction data yet
  (new listings, unpopular products).
- `GET /recommendations/me` — personalized to the caller's own
  interaction history. **Deliberately `/me` instead of the spec's literal
  `GET /recommendations/:userId`**: a user's interaction profile is
  personal data, so this follows the same ownership-check pattern used
  everywhere else in this API (e.g. subscription cancellation) rather
  than letting anyone read anyone else's profile via a URL param. Falls
  back to platform-wide popularity (by purchase count, or newest active
  listings if there are no orders anywhere yet) for brand-new buyers with
  no interaction history — the classic recommender "cold start" problem.

**Known simplification**: the co-occurrence matrix is rebuilt from all
users' interactions fresh on every request — fine at portfolio scale, but
at real scale this would be precomputed by a background job (BullMQ,
Phase 7) on a schedule instead of recomputed synchronously per request.

## Known placeholders (deliberate, not forgotten)

- **Product images**: `Product.imageUrl` is just a plain string field —
  paste any image URL when creating a product. No file upload, no S3.
  Wiring up real presigned S3 uploads is Phase 6 and won't require
  changing this field's shape.
- **Payments**: `src/lib/payments/paymentProvider.ts` exports a stub
  `chargeBuyer()` that always "succeeds" instantly — no card is ever
  charged, no Stripe account is required to run this locally. It's the
  **only file** that needs to change when real Stripe Connect (split
  payments to sellers) gets wired up later; nothing in
  `checkout.service.ts` needs to change.
- **Billing**: `src/lib/billing/billingProvider.ts` exports stub
  `startSubscription()`/`cancelSubscription()` functions — subscriptions
  activate instantly with no real recurring charge and no webhooks yet.
  It's the **only file** that needs to change when real Stripe Billing
  gets wired up later; nothing in `subscriptions.service.ts` needs to
  change. Real webhook handling (`invoice.paid`,
  `customer.subscription.deleted`, etc.) is still TODO for whenever a
  real Stripe account gets connected.

## Quick manual test (curl)

```
curl -c cookies.txt -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"BUYER"}'

curl -b cookies.txt http://localhost:4000/users/me
curl http://localhost:4000/categories
curl http://localhost:4000/products
curl http://localhost:4000/plans?audience=BUYER
```

## Automated tests

Four integration test suites, all hitting your real local database
in-memory through `app` (no need for `npm run dev` running separately):

- `test/auth.test.ts` — signup, duplicate-email rejection, wrong-password
  rejection, login, and the `/users/me` auth guard (5 tests).
- `test/checkout.test.ts` — seeds a category + two sellers + two
  products directly via Prisma, signs a buyer up through the real
  `/auth/signup` endpoint, then checks out a cart spanning both
  sellers and asserts: two orders are created, the commission math is
  correct for each, stock is decremented on both products, an
  unauthenticated checkout is rejected, and an over-quantity order is
  rejected (5 tests).
- `test/subscriptions.test.ts` — subscribes a buyer to "Kindred+" through
  the real `/subscriptions` endpoint, gives one seller a "Pro"
  subscription directly via Prisma, then asserts: the discount AND
  lower commission both apply in the same checkout, a non-subscribed
  seller still gets the buyer's discount but the default commission,
  the Pro seller's product ranks above the free-tier seller's in
  `GET /products`, and canceling a subscription works (6 tests).
- `test/recommendations.test.ts` — builds a small deliberate interaction
  graph directly via Prisma (two "other" buyers who both purchase one
  product and positively review a second, plus one of them views a
  third), then asserts: `GET /products/:id/similar` ranks the
  more-strongly-linked product first, falls back to same-category
  products when there's no interaction data at all, `GET
  /recommendations/me` requires auth, correctly recommends the
  co-occurring product to a signed-in buyer based on their own purchase
  and never recommends something they already have, view-logging on
  `GET /products/:id` fires for a signed-in visitor, and does **not**
  fire for an anonymous one (6 tests).

**Requires seed data**: `test/subscriptions.test.ts` looks up the
"buyer-plus" and "seller-pro" plans by slug, so run `npm run
prisma:seed` at least once before `npm test`.

```
npm test
```

You should see 22 passing tests total. Run this after any change to
auth, products, checkout, subscriptions, or recommendations to make sure
you didn't break something.

## Security hardening so far

- Passwords hashed with bcrypt, never stored or returned in plain text
- Session token in an httpOnly cookie (JavaScript can't read it, blocks
  XSS token theft)
- `express-rate-limit` on `/auth/signup` and `/auth/login` — 20 attempts
  per IP per 15 minutes, blocks brute-force password guessing and mass
  fake-account creation
- All request bodies/queries validated with zod before touching
  business logic
- Product/order/subscription ownership checks (a seller can only edit
  their own products; a user can only see/cancel their own
  subscriptions; only the buyer or seller on an order can see it via
  the `/orders/*` endpoints)
- Checkout is wrapped in a single Prisma transaction, so a crash
  mid-checkout can never leave stock decremented without a matching
  order (or vice versa)

**Deliberately not done yet** (belongs to later phases per
`PROJECT_INSTRUCTIONS.md`, not forgotten): real payments (Stripe
Connect), real recurring billing + webhooks (Stripe Billing), real image
uploads (S3), refresh-token rotation, CI pipeline running these tests
automatically on every push (Phase 9), secrets in a real secret manager
instead of `.env` (Phase 6, once this deploys to AWS).

## Next step

Phase 5 (AI Feature 2: semantic/hybrid search) per `PROJECT_INSTRUCTIONS.md`.
