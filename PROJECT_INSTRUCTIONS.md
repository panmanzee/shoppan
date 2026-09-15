# Marketplace + Subscription Commerce Platform — Project Instructions

> Give this file to Claude Code at the repo root and build phase by phase.
> Goal: an internship-portfolio project that combines a **multi-vendor
> marketplace** with a **subscription layer for both buyers and sellers**,
> deployed on real cloud infrastructure — demonstrating full-stack
> engineering, applied ML, and networking/cloud literacy in one project.

## 0. Overview

**What this is:** a marketplace (think Etsy/Shopee-style: many sellers,
one catalog, buyers browse and purchase from multiple sellers in one cart)
layered with a **subscription program** — buyers can subscribe for perks
(discounts, free shipping, early access), sellers can subscribe for perks
(lower commission, better search placement, analytics). Pick a concrete
niche before Phase 1 (e.g. handmade goods, indie digital products, local
artisan food, secondhand fashion) — the niche doesn't need to be exotic,
the engineering depth is the differentiator.

**Why this combo beats either alone:** a plain marketplace mostly proves
you can build CRUD + search. A plain subscription app mostly proves you
can build billing. Combining them forces you to solve problems that show
up together in real companies (Amazon/Prime, Etsy/Etsy Plus, Faire):
multi-party payments (splitting money between platform and sellers),
tiered perks that change business logic at checkout, and a catalog large
enough to need real search/recommendation, not just a `WHERE` clause.

**Non-goals (keep these out of scope, even with unlimited time — scope
creep kills portfolio projects):** building your own payment processor
(use Stripe), training or fine-tuning a foundation model, a native mobile
app, a custom admin CMS with drag-and-drop page building, supporting
multiple currencies/languages on day one.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS | Matches 2026 job market demand |
| Backend | Node.js + Express + TypeScript | Type safety, shared types w/ frontend |
| Database | PostgreSQL (AWS RDS) + `pgvector` extension | Relational integrity for orders/billing + vector search in the same DB |
| ORM | Prisma | Migrations + type-safe queries |
| Payments | Stripe Billing + Checkout + **Stripe Connect** (marketplace payouts/commission split) + Webhooks, test mode | Connect is the piece that makes it a real marketplace, not a single-seller store |
| Cache / Queue | Redis (AWS ElastiCache) + BullMQ | Background jobs: billing cycles, embedding generation, image processing, emails |
| Search / Recommendation | `pgvector` (or Pinecone/Weaviate) for embeddings; a small Python service (scikit-learn / `implicit`) for collaborative filtering | Two different AI techniques — see Phases 4–5 |
| Cloud Provider | AWS | Matches your Skill Builder course — you can apply it directly |
| Object storage / CDN | S3 + CloudFront | Product images, static assets |
| Serverless / async | AWS Lambda | Image resize, embedding generation, notification sends |
| Networking | VPC (public + private subnets, 2+ AZs), ALB / API Gateway, Route53, security groups, NAT gateway | This is the phase that actually proves networking skill — see Phase 6 |
| Containerization | Docker (per-service Dockerfile + docker-compose for local dev) | |
| Orchestration | ECS Fargate (simplest AWS-native) **or** Kubernetes (EKS / local kind) with autoscaling | Pick one — don't do both |
| IaC | Terraform | VPC, RDS, ElastiCache, S3, CloudFront, ECS/EKS, IAM — provisioned as code |
| CI/CD | GitHub Actions | Lint, typecheck, test, build on every PR |
| Testing | Vitest/Jest + Supertest (unit/integration), Playwright (e2e) | |
| Load testing | k6 | Proves the scaling claims with real numbers |

---

## Phase 1 — Foundation (Auth + Core Models)

- Auth: role-based (`buyer`, `seller`, `admin`), email/password + at least
  one OAuth provider, sessions via JWT (httpOnly cookies, not localStorage)
- Core models: `User`, `SellerProfile`, `Product`, `Category`, `Order`,
  `OrderItem`, `Plan` (buyer tiers + seller tiers, keep them as separate
  `PlanType` so logic doesn't get tangled), `Subscription`, `BillingCycle`,
  `Invoice`
- A `User` can hold a `SellerProfile` (become a seller without a separate
  account) — decide this now, it affects the schema a lot later
- Architecture: layered (`controller → service → repository`)
- Input validation with `zod` on every incoming request
- Centralized error-handling middleware, consistent API error shape
- Env config via a validated `.env` schema
- Structured logging (`pino`)

**Definition of done:** a user can sign up, choose to become a seller,
log in, and see available subscription plans for their role.

---

## Phase 2 — Marketplace Core

This is the part that makes it a marketplace and not a storefront.

- Seller-side: create/edit/delete product listings, upload images
  (presigned S3 upload URLs, never proxy the file through your own server)
- Buyer-side: browse catalog, filter by category/price, paginate, view a
  public seller storefront page
- Cart that can hold items from **multiple sellers at once**
- Checkout: split a single cart into per-seller sub-orders; use **Stripe
  Connect** so each seller gets paid their share minus platform commission
  — this is the realistic, hard part, don't fake it with a single flat
  payment
- Order history for both buyer (their purchases) and seller (their sales)
- Reviews/ratings per product and per seller

**Definition of done:** a buyer can check out a cart containing products
from two different sellers in one transaction, and each seller's payout
is correctly split in Stripe's test dashboard.

---

## Phase 3 — Subscription Layer (Buyers *and* Sellers)

- **Buyer perks** (pick 3–4, don't build all of them): free/priority
  shipping, early access to deals, member-only discount %, no ads on
  listings, extended return window
- **Seller perks** (pick 3–4): lower commission % on the tier above free,
  priority placement in search/category results, an analytics dashboard
  (sales trends, top products), ability to run time-limited promotions
- Stripe Billing integration, **idempotent** webhook handling
  (`invoice.paid`, `invoice.payment_failed`,
  `customer.subscription.updated`, `customer.subscription.deleted`)
- Verify webhook signatures — never trust an unverified payload
- Failed-payment handling: retry/dunning flow, grace period
- Prorated upgrade/downgrade between tiers
- **Perk enforcement**: the checkout and search logic from Phase 2 must
  actually read subscription status and apply the perk (discount amount,
  commission rate, search boost) — this is where the two halves of the
  project connect, don't leave subscriptions as a decorative pricing page

**Definition of done:** a subscribed buyer sees a discount applied at
checkout automatically; a subscribed seller's commission rate and search
ranking visibly differ from a free-tier seller's, traceable in the DB.

---

## Phase 4 — AI Feature 1: Recommendation Engine

- Collaborative filtering (start with a matrix-factorization library like
  `implicit`, or content-based if you don't have enough interaction data
  yet) producing "recommended for you" and "similar products"
- Signals: view history, purchase history, ratings
- Expose as an API endpoint (`GET /recommendations/:userId`), surface on
  homepage and product detail page
- **Note on managed alternatives:** AWS Personalize does this as a
  managed service — that's fine, it doesn't make this pointless. Building
  it yourself is what proves you understand the algorithm rather than
  just calling an API. You can even mention in the README that you
  evaluated Personalize and chose to implement it yourself for that
  reason.

---

## Phase 5 — AI Feature 2: Semantic Product Search

A second AI feature that's a genuinely different technique from Phase 4
(embeddings/NLP vs. collaborative filtering) — this pairs naturally with
a marketplace since search is core functionality, not bolted on.

- Generate embeddings for product title + description (OpenAI embeddings
  API, or a local model via AWS Bedrock)
- Store vectors in `pgvector` (simplest — same Postgres instance) or a
  dedicated vector DB if you want that on your resume specifically
- Enable natural-language search ("cozy blue sweater for winter") that
  keyword search would miss
- Report a real evaluation, not just a demo: e.g. precision@k on a small
  hand-labeled query set, compared against plain keyword search
- **Optional stretch, only if time allows:** a small RAG-based shopping
  assistant that answers questions about a product using its description
  + reviews as context

---

## Phase 6 — Cloud & Networking Infrastructure (AWS)

**This is the phase that directly showcases your AWS Skill Builder
learning — don't skip or rush it, it's a full phase on its own, not an
afterthought tacked onto deployment.**

- VPC with public subnets (ALB, NAT gateway) and private subnets (app
  containers, RDS, ElastiCache), spread across 2+ Availability Zones
- Security groups scoped per tier (web / app / db) — least privilege,
  nothing open to `0.0.0.0/0` except the ALB on 443
- RDS PostgreSQL and ElastiCache Redis in private subnets only
- S3 + CloudFront for product images and static assets
- Lambda functions for background work: image resizing on upload,
  embedding generation for new products, notification emails — don't do
  this inline in the request/response cycle
- ALB or API Gateway routing to ECS Fargate (or EKS) containers
- Route53 for DNS + a custom domain
- IAM roles scoped per service — no shared admin credentials
- Terraform provisioning all of the above as code
- **Deliverable that actually proves this phase happened:** an
  architecture diagram in the README showing the VPC/subnet/service
  topology. A diagram is what a reviewer actually looks at — a bullet
  list of AWS service names is not evidence by itself.

---

## Phase 7 — Scaling & Load Testing

- Dockerize every service; `docker-compose.yml` for local dev
- ECS Fargate service auto-scaling, or Kubernetes HPA if you chose EKS —
  actually run a load test and show it scale
- Load test with k6, **document before/after latency and error-rate
  numbers** in the README

---

## Phase 8 — Design / Theme

- Study the *patterns* of established marketplaces (Etsy's product-card
  layout, Amazon's search/filter UX) for structure — adapt the patterns
  (whitespace, card hierarchy, filter placement), do not copy any brand's
  logo, exact copy, or proprietary visual assets
- Clean, minimal aesthetic: generous whitespace, clear typography scale,
  one accent color
- Product card component and a plan-comparison table component — both
  get screenshotted a lot, worth polishing
- Mobile-first responsive; test checkout on a narrow viewport specifically

---

## Phase 9 — Testing, CI/CD & Security

- **Unit tests**: commission-split math, proration math, recommendation
  scoring, search relevance ranking
- **Integration tests**: API endpoints, webhook handlers with mocked
  Stripe events
- **E2E test** (Playwright), the full critical path: sign up → become a
  seller → list a product → (as a different user) buy from two sellers in
  one cart → seller subscribes → seller's commission rate updates →
  buyer subscribes → buyer sees discount at next checkout
- **GitHub Actions**: lint → typecheck → test → build, required before merge
- Secrets never committed — `.env.example` only
- SQL injection safety via Prisma parameterization
- Auth guards + rate limiting on every sensitive route
- API documented (OpenAPI/Swagger, even minimal)
- Conventional commit messages

---

## Final Checklist

- [ ] Niche chosen and named
- [ ] Auth + role-based accounts (buyer/seller) working
- [ ] Multi-seller cart + Stripe Connect split payout working end-to-end
- [ ] Buyer and seller subscription tiers working, perks actually enforced
      in checkout/search logic (not just a pricing page)
- [ ] Recommendation engine live and evaluated
- [ ] Semantic search live and evaluated against keyword baseline
- [ ] VPC/networking deployed on AWS with an architecture diagram in the README
- [ ] Terraform provisioning the AWS infra
- [ ] Autoscaling demonstrated under a k6 load test, numbers documented
- [ ] Design polish pass done, mobile-tested
- [ ] Test suite (unit/integration/e2e) passing in CI
- [ ] README covers: what it does, architecture diagram, how to run
      locally, load-test results, and what you'd do differently at real scale

---

## Recommended tools while building

- **Stripe CLI** — forward webhooks to localhost during development
  (`stripe listen --forward-to localhost:PORT/webhooks/stripe`)
- **Stripe Connect docs** — read this before Phase 2, the payout model is
  the trickiest part of the whole project
- **AWS CLI + Terraform** (or AWS CDK if you prefer TypeScript IaC)
- **k6** — load testing, scriptable in JS
- **Postman or Insomnia** — manual API testing alongside the automated suite
- **Prisma Studio** — quick DB inspection during development

When actually building with Claude Code, hand it this file plus one phase
at a time rather than the whole document at once — keeps each session
focused and easier to review.
