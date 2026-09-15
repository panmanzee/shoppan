# Shoppan — Handmade Goods Marketplace

> A full-stack, production-grade e-commerce marketplace built from scratch — inspired by Etsy. Multi-seller storefronts, AI-powered recommendations, semantic search, Stripe billing, and AWS infrastructure — all in a single monorepo.

![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat&logo=stripe&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat&logo=amazonaws&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat&logo=terraform&logoColor=white)
![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat&logo=githubactions&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [AI Features](#ai-features)
- [Subscription & Billing System](#subscription--billing-system)
- [Infrastructure (AWS + Terraform)](#infrastructure-aws--terraform)
- [CI/CD Pipeline](#cicd-pipeline)
- [Load Testing](#load-testing)
- [Getting Started Locally](#getting-started-locally)
- [Demo Accounts](#demo-accounts)
- [Design Decisions](#design-decisions)

---

## Overview

Shoppan is a full-featured marketplace platform where independent makers can sell handmade goods directly to buyers. It supports multi-seller checkouts, tiered subscription plans (for both buyers and sellers), AI-powered product recommendations, semantic search with vector embeddings, and a complete AWS cloud deployment.

This project was built phase by phase — each phase shipping working, tested code before moving to the next — to simulate real-world iterative delivery.

---

## Feature Highlights

| # | Phase | What was built |
|---|-------|----------------|
| 1 | **Auth & Core Models** | JWT httpOnly cookie auth, bcrypt passwords, rate limiting, Zod validation, role-based access (BUYER / SELLER / ADMIN) |
| 2 | **Marketplace Core** | Product CRUD, seller storefronts, multi-seller cart checkout, per-seller order splitting, commission math, reviews |
| 3 | **Subscription & Billing** | Stripe-backed buyer/seller subscription tiers; perks enforced in checkout (buyer discounts, seller commission rates, search boost) |
| 4 | **Recommendation Engine** | Hand-built item-based collaborative filtering via a weighted co-occurrence matrix — no third-party ML library |
| 5 | **Semantic Search** | pgvector + OpenAI `text-embedding-3-small` for semantic product search; full-text Postgres fallback when no API key is set |
| 6 | **AWS Infrastructure** | Terraform-managed VPC, RDS PostgreSQL, ECS Fargate, ALB, S3 + CloudFront CDN |
| 7 | **Docker + Load Tests** | Multi-stage Dockerfiles for API & web; k6 smoke / load / stress test suites |
| 8 | **Frontend Integration** | Next.js 14 App Router; all pages wired to real API — no mock data |
| 9 | **CI/CD** | GitHub Actions pipeline: lint → typecheck → integration tests (with ephemeral Postgres) → build → Docker build |

---

## Tech Stack

### Frontend — `apps/web`
| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, RSC + Client Islands) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS |
| State | React Context (Auth, Cart with localStorage persistence) |
| HTTP | Typed fetch client (`api-client.ts`) |

### Backend — `apps/api`
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Language | TypeScript 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 + pgvector extension |
| Validation | Zod |
| Logging | Pino + pino-http |
| Auth | JWT (httpOnly cookie) + bcryptjs |
| Payments | Stripe PaymentIntents + Billing (dev stub fallback) |
| AI | OpenAI embeddings (`text-embedding-3-small`) |
| Testing | Vitest + Supertest (integration tests against real DB) |

### Infrastructure & DevOps
| Layer | Technology |
|-------|-----------|
| Containerisation | Docker (multi-stage) + Docker Compose (local dev) |
| Cloud | AWS (ECS Fargate, RDS, ALB, S3, CloudFront) |
| IaC | Terraform |
| CI/CD | GitHub Actions |
| Load Testing | k6 |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                            │
│              Next.js 14 App Router  ·  Tailwind CSS                  │
└───────────────────────────┬──────────────────────────────────────────┘
                            │  HTTPS / REST JSON
                            ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      EXPRESS REST API  (port 4000)                   │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │   Auth   │  │ Products │  │ Checkout │  │  Recommendations /   │ │
│  │ (JWT     │  │ CRUD +   │  │ (multi-  │  │  Semantic Search     │ │
│  │  cookie) │  │ Search   │  │  seller) │  │  (pgvector + OAI)    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  Orders  │  │  Sellers │  │  Plans / │  │  Stripe Webhooks     │ │
│  │          │  │ Reviews  │  │  Subs    │  │  (billing events)    │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────────┘ │
│                                                                      │
│              Controller → Service → Repository pattern               │
└────────────────────────────┬─────────────────────────────────────────┘
                             │  Prisma ORM
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│            PostgreSQL 16  +  pgvector extension                      │
│   Users · Products · Orders · Subscriptions · Reviews · Embeddings  │
└──────────────────────────────────────────────────────────────────────┘

           ┌──────────────┐          ┌──────────────┐
           │   Stripe API │          │  OpenAI API  │
           │ (Payments +  │          │ (Embeddings  │
           │  Billing)    │          │  for search) │
           └──────────────┘          └──────────────┘
```

### Request lifecycle
Every request goes through `asyncHandler` (global error catch) → auth middleware → Zod schema validation → controller → service → repository → Prisma → PostgreSQL. Errors propagate upward and are formatted uniformly by the Express error handler.

---

## Project Structure

```
project_ecom/
├── apps/
│   ├── api/                        # Express REST API
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # All DB models
│   │   │   ├── seed.ts             # Demo data (categories, plans, sellers, products)
│   │   │   └── migrations/         # Prisma migration history
│   │   ├── src/
│   │   │   ├── app.ts              # Express app + route registration
│   │   │   ├── server.ts           # Process entry point
│   │   │   ├── config/             # Constants, env validation
│   │   │   ├── lib/
│   │   │   │   ├── payments/       # Stripe PaymentIntents (stub in dev)
│   │   │   │   ├── billing/        # Stripe Subscriptions (stub in dev)
│   │   │   │   └── search/         # pgvector + full-text fallback
│   │   │   ├── middleware/         # Auth, rate limit, asyncHandler
│   │   │   └── modules/
│   │   │       ├── auth/           # signup · login · logout
│   │   │       ├── products/       # CRUD + search boost + embeddings
│   │   │       ├── sellers/        # Storefronts + seller reviews
│   │   │       ├── checkout/       # Multi-seller cart → per-seller orders
│   │   │       ├── orders/         # Buyer history · seller fulfillment
│   │   │       ├── subscriptions/  # Plans · subscribe · cancel
│   │   │       ├── recommendations/# Collaborative filtering engine
│   │   │       ├── search/         # Hybrid semantic + full-text
│   │   │       ├── reviews/        # Product reviews (1 per person)
│   │   │       ├── users/          # Profile · become-seller
│   │   │       ├── admin/          # Platform stats
│   │   │       └── webhooks/       # Stripe event handler
│   │   ├── test/                   # Integration test suites (Vitest + Supertest)
│   │   ├── k6/                     # Load test scripts (smoke / load / stress)
│   │   ├── Dockerfile              # Multi-stage production build
│   │   └── .env.example            # Required environment variables
│   │
│   └── web/                        # Next.js 14 frontend
│       └── src/
│           ├── app/
│           │   ├── page.tsx                    # Home (hero + personalized recs)
│           │   ├── products/                   # Browse · filter · detail
│           │   ├── sellers/                    # Maker directory · storefronts
│           │   ├── cart/                       # Cart (localStorage-persisted)
│           │   ├── checkout/                   # Multi-step checkout
│           │   ├── search/                     # Semantic search results
│           │   ├── pricing/                    # Subscription plans
│           │   ├── dashboard/
│           │   │   ├── buyer/                  # Order history · subscription
│           │   │   └── seller/                 # Revenue chart · listings · profile
│           │   ├── login/ & signup/
│           │   └── admin/                      # Platform stats (ADMIN role)
│           ├── components/
│           │   ├── ProductCard.tsx             # Reusable card with add-to-cart
│           │   ├── RecommendedProducts.tsx     # Client island for personalization
│           │   ├── Navbar.tsx                  # Responsive nav + mobile search
│           │   └── Footer.tsx
│           └── lib/
│               ├── api-client.ts               # Typed fetch client + all API types
│               ├── auth-context.tsx            # AuthProvider + useAuth hook
│               ├── cart-context.tsx            # CartProvider + useCart hook
│               └── types.ts                    # UI-only display types
│
├── infra/terraform/                # AWS infrastructure as code
│   ├── main.tf · vpc.tf · rds.tf
│   ├── ecs.tf · s3.tf · cloudfront.tf
│   ├── variables.tf · outputs.tf
│   └── ...
│
├── .github/workflows/ci.yml        # GitHub Actions CI pipeline
└── docker-compose.yml              # Local Postgres (port 5433)
```

---

## Database Schema

16 models across 5 domains:

```
Users & Identity          Catalog               Commerce
─────────────────         ───────────           ────────────────────
User                      Category              Order
  └─ SellerProfile         └─ Product            └─ OrderItem
                               └─ ProductView
                               └─ ProductReview  Subscriptions & Billing
Seller Reviews                                   ────────────────────────
  SellerReview                                   Plan
                                                 Subscription
                                                   ├─ Invoice
                                                   └─ BillingCycle
```

Key design choices:
- **Prices stored as integer cents** — no floating-point rounding errors
- **Orders split per-seller at checkout** — commission and payout are tracked per seller even if a buyer's cart spans multiple storefronts
- **`embedding vector(1536)`** stored directly on `Product` via pgvector — semantic search with no external vector DB required
- **`ProductView` model** captures authenticated view history as a recommendation signal (purchase weight=3, positive review weight=2, view weight=1)

---

## API Reference

All endpoints are prefixed by `http://localhost:4000`. Authentication uses a `kindred_session` httpOnly cookie set on login.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | — | Register (role: `BUYER` or `SELLER`) |
| POST | `/auth/login` | — | Login, sets session cookie |
| POST | `/auth/logout` | — | Clear session cookie |

### Users
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | ✓ | Current user + seller profile |
| POST | `/users/me/become-seller` | ✓ | Upgrade to SELLER role |
| PATCH | `/users/me/seller-profile` | ✓ | Update storeName, bio, avatarUrl, bannerUrl |

### Products
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/products` | — | Browse catalog (filter by category, price, pagination) |
| GET | `/products/:id` | — | Single product detail + records view signal |
| POST | `/products` | ✓ (SELLER) | Create product listing |
| PATCH | `/products/:id` | ✓ (owner) | Update listing |
| DELETE | `/products/:id` | ✓ (owner) | Delete listing |
| GET | `/products/:id/reviews` | — | Product reviews |
| POST | `/products/:id/reviews` | ✓ | Leave a review (one per person) |
| GET | `/products/:id/similar` | — | Similar products (collaborative filtering) |

### Sellers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sellers` | — | All seller storefronts |
| GET | `/sellers/:slug` | — | Seller profile + their active products |

### Commerce
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/checkout` | ✓ | Checkout cart → splits into per-seller orders |
| GET | `/orders/mine` | ✓ | Buyer's order history |
| GET | `/orders/selling` | ✓ (SELLER) | Orders for your storefront |
| PATCH | `/orders/:id/fulfill` | ✓ (SELLER) | Mark order as fulfilled |

### Subscriptions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/plans` | — | List plans (`?audience=BUYER\|SELLER`) |
| POST | `/subscriptions` | ✓ | Subscribe to a plan |
| GET | `/subscriptions/mine` | ✓ | Your subscription history |
| DELETE | `/subscriptions/:id` | ✓ | Cancel a subscription |

### AI & Search
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search?q=` | — | Hybrid semantic + full-text search |
| GET | `/recommendations/me` | ✓ | Personalised "for you" recommendations |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/stats` | ✓ (ADMIN) | Platform-wide metrics |

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
A cart spanning two sellers produces **two** `Order` objects in the response — one per seller — each with `subtotalCents`, `discountCents`, `commissionCents`, and `sellerPayoutCents`.

---

## AI Features

### 1. Recommendation Engine (`GET /recommendations/me`, `GET /products/:id/similar`)

Built from scratch — **no third-party ML library**. Uses item-based collaborative filtering via a weighted co-occurrence matrix:

- For every user, every pair of products they've interacted with gets a co-occurrence bump proportional to the product of their interaction weights
- **Signal weights**: purchase (3) · positive review (2) · product view (1)
- Two use cases: `similar` (public, item-based) and `recommendations/me` (personalised, requires auth)
- **Cold-start fallback**: falls back to same-category products (for `similar`) or platform-wide purchase popularity (for `recommendations/me`) when there's not enough interaction data

> AWS Personalize was evaluated and intentionally rejected — the goal was to demonstrate understanding of the underlying algorithm, not outsource it.

### 2. Semantic Search (`GET /search?q=`)

- Uses OpenAI `text-embedding-3-small` to embed both the query and product titles/descriptions
- Similarity computed via cosine distance directly in PostgreSQL using the **pgvector** extension (`vector(1536)` column on `Product`)
- No external vector database required — queries look like: `ORDER BY embedding <=> $queryVector`
- **Graceful fallback**: when `OPENAI_API_KEY` is not set, automatically falls back to Postgres full-text search (`to_tsvector` / `plainto_tsquery`)

---

## Subscription & Billing System

Two subscription audiences, each with a free tier and a paid tier:

| Audience | Plan | Price | Perks |
|----------|------|-------|-------|
| Buyer | Free | $0 | Standard checkout |
| Buyer | Kindred+ | $4.99/mo | **10% discount** on all orders at checkout |
| Seller | Free | $0 | 12% platform commission |
| Seller | Pro | $19.99/mo | **6% commission**, **search boost** (ranked above free-tier sellers) |

Perks are **actually enforced** in the checkout and product listing logic — not just marketing copy:
- `checkout.service.ts` reads the buyer's active plan and applies `discountCents`
- `checkout.service.ts` reads each seller's active plan and applies the appropriate `commissionPercent`
- `products.repository.ts` orders Pro-tier sellers first in `GET /products`

Stripe is wired via a clean provider abstraction (`paymentProvider.ts`, `billingProvider.ts`) that falls back to a dev stub when `STRIPE_SECRET_KEY` is not set — so the entire flow works locally without a Stripe account.

---

## Infrastructure (AWS + Terraform)

All AWS resources are defined in `infra/terraform/`:

```
VPC
├── Public subnets   → Application Load Balancer
├── Private subnets  → ECS Fargate tasks (API + Web containers)
└── Private subnets  → RDS PostgreSQL (Multi-AZ)

S3 bucket           → Static assets / product images
CloudFront CDN      → Fronts both the ALB and S3

ECS Fargate         → Auto-scaling task definitions for API & Web
ALB                 → HTTPS termination + path-based routing
RDS PostgreSQL 16   → Managed DB with automated backups
```

Key Terraform files:
- `vpc.tf` — VPC, subnets, NAT gateway, route tables
- `ecs.tf` — Task definitions, services, auto-scaling policies
- `rds.tf` — RDS instance, subnet group, parameter group
- `s3.tf` + `cloudfront.tf` — CDN distribution with S3 origin
- `outputs.tf` — ALB DNS name, RDS endpoint, CloudFront URL

---

## CI/CD Pipeline

`.github/workflows/ci.yml` runs on every push to `main`/`dev` and every pull request:

```
┌─────────────────────────────────┐    ┌─────────────────────────────────┐
│          API job                │    │          Web job                 │
│  1. Spin up ephemeral Postgres  │    │  1. npm ci                       │
│  2. npm ci                      │    │  2. TypeScript typecheck         │
│  3. prisma generate + migrate   │    │  3. next build                   │
│  4. TypeScript typecheck        │    └─────────────────────────────────┘
│  5. vitest (22 integration tests│
│     against real DB)            │
│  6. npm run build               │
└─────────────────────────────────┘
```

Both jobs also build the Docker image to verify the `Dockerfile` compiles cleanly in CI.

---

## Load Testing

Three k6 scenarios in `apps/api/k6/`:

| Script | Config | Purpose |
|--------|--------|---------|
| `smoke.js` | 1 VU · 60s | Verify all endpoints respond after a deploy |
| `load.js` | 50 VUs · 8 min | Realistic user journeys under expected traffic |
| `stress.js` | Ramp to 400 VUs | Find the breaking point (throughput, error rate, p95 latency) |

```bash
k6 run apps/api/k6/smoke.js
k6 run apps/api/k6/load.js
k6 run -e API_BASE=https://your-alb.aws.com apps/api/k6/stress.js
```

---

## Getting Started Locally

### Prerequisites
- Node.js 20+
- Docker Desktop
- (Optional) Stripe account for real payments
- (Optional) OpenAI API key for semantic search

### 1. Clone and start the database
```bash
git clone https://github.com/YOUR_USERNAME/shoppan.git
cd shoppan
docker compose up -d        # starts Postgres on port 5433
```

### 2. Set up the API
```bash
cd apps/api
cp .env.example .env        # fill in JWT_SECRET at minimum
npm install
npm run prisma:migrate
npm run prisma:seed         # seeds categories, plans, demo sellers & products
npm run dev                 # http://localhost:4000
```

### 3. Set up the web app
```bash
cd apps/web
# .env.local already contains: NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:3000
```

### 4. Run the test suite
```bash
cd apps/api
npm test                    # 22 integration tests
```

### Environment variables

**`apps/api/.env`** (see `.env.example`):
```env
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://kindred:kindred_dev_password@localhost:5433/kindred
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
COOKIE_NAME=kindred_session

# Optional — enables real Stripe payments & billing
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional — enables semantic search (falls back to full-text without this)
OPENAI_API_KEY=sk-...
```

**`apps/web/.env.local`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Demo Accounts

After running `npm run prisma:seed`:

| Role | Email | Password |
|------|-------|----------|
| Buyer | `buyer@demo.kindred` | `demo1234` |
| Seller | `willow@demo.kindred` | `demo1234` |

---

## Design Decisions

**Why hand-build the recommendation engine instead of using a library?**
The goal was to demonstrate understanding of collaborative filtering, not just calling `implicit` or AWS Personalize. The co-occurrence matrix approach is simpler and more explainable than matrix factorization, while producing the same qualitative results at portfolio scale.

**Why pgvector instead of a dedicated vector DB (Pinecone, Weaviate)?**
Adding a separate vector database would introduce operational overhead with no benefit at this scale. pgvector runs inside the same Postgres instance already used for all relational data, keeping the architecture simple and the query latency low (vector similarity is computed inside the same transaction as filtering by category/price).

**Why split orders per-seller at checkout?**
Real marketplace platforms (Etsy, Amazon) use per-merchant orders so that commission, payout, and fulfillment can be tracked independently per seller. Storing it as one flat order would make the commission math invisible and seller payouts impossible.

**Why httpOnly cookies instead of localStorage for auth tokens?**
httpOnly cookies are inaccessible to JavaScript, which means an XSS vulnerability in the client cannot steal the session token. `express-rate-limit` on auth endpoints and Zod validation on all inputs add further defence-in-depth.

**Why the Controller → Service → Repository pattern?**
Each layer has a clear responsibility: controllers parse HTTP (and nothing else), services own business logic, repositories own database queries. This makes the code easy to test in isolation and easy to swap out a layer (e.g. replace Prisma with raw SQL in a repository without touching any business logic).

---

## Test Coverage

22 integration tests across 4 suites, all running against a real PostgreSQL database:

| Suite | Tests | What's covered |
|-------|-------|----------------|
| `auth.test.ts` | 5 | Signup, duplicate email, wrong password, login, auth guard |
| `checkout.test.ts` | 5 | Multi-seller split, commission math, stock decrement, auth guard, over-quantity rejection |
| `subscriptions.test.ts` | 6 | Buyer discount, seller commission, search boost ranking, plan cancellation |
| `recommendations.test.ts` | 6 | Co-occurrence ranking, cold-start fallback, personalised recs, view logging, auth guard |

---

*Built with care by [Your Name](https://github.com/YOUR_USERNAME)*
