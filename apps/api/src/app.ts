/**
 * Builds and configures the Express app (middleware + routes) but does
 * NOT start listening — that's server.ts's job. Splitting them apart
 * means tests can import `app` and hit it with supertest without ever
 * binding a real port.
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";
import { authRouter } from "@/modules/auth/auth.routes";
import { usersRouter } from "@/modules/users/users.routes";
import { plansRouter } from "@/modules/plans/plans.routes";
import { categoriesRouter } from "@/modules/categories/categories.routes";
import { productsRouter } from "@/modules/products/products.routes";
import { sellersRouter } from "@/modules/sellers/sellers.routes";
import { reviewsRouter } from "@/modules/reviews/reviews.routes";
import { checkoutRouter } from "@/modules/checkout/checkout.routes";
import { ordersRouter } from "@/modules/orders/orders.routes";
import { subscriptionsRouter } from "@/modules/subscriptions/subscriptions.routes";
import { recommendationsRouter } from "@/modules/recommendations/recommendations.routes";
import { stripeWebhookRouter } from "@/modules/webhooks/stripe.routes";
import { searchRouter } from "@/modules/search/search.routes";
import { adminRouter } from "@/modules/admin/admin.routes";

export const app = express();

// --- Stripe webhook MUST be mounted before express.json() ---
// Stripe signature verification requires the raw (unparsed) request body.
// express.raw() reads the body as a Buffer; express.json() would overwrite it.
app.use("/webhooks", express.raw({ type: "application/json" }), stripeWebhookRouter);

// --- Security & platform middleware ---
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true, // required so the browser sends/receives the httpOnly cookie
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(pinoHttp({ logger }));

// --- Health check (used by load balancers / uptime checks later) ---
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// --- Feature routes ---
app.use("/auth", authRouter);
app.use("/users", usersRouter);
app.use("/plans", plansRouter);
app.use("/categories", categoriesRouter);
app.use("/products", productsRouter);
app.use("/sellers", sellersRouter);
app.use("/checkout", checkoutRouter);
app.use("/orders", ordersRouter);
app.use("/subscriptions", subscriptionsRouter);
// reviewsRouter owns its own full paths (/products/:id/reviews,
// /sellers/:id/reviews) so it's mounted at the root, not under a prefix.
app.use(reviewsRouter);
// Same story for recommendationsRouter: it owns /products/:id/similar
// (under the products prefix) as well as /recommendations/me, so it's
// mounted at the root rather than under a single fixed prefix.
app.use(recommendationsRouter);
// Semantic search: GET /search?q=... and POST /search/embeddings/backfill
app.use(searchRouter);
app.use("/admin", adminRouter);

// --- 404 + error handling (must be registered last, in this order) ---
app.use(notFoundHandler);
app.use(errorHandler);
