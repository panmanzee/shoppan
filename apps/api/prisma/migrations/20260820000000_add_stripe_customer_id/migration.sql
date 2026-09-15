-- Phase 3: Add Stripe Customer ID to users table
-- Cached on first subscribe so we don't create duplicate Stripe customers.

ALTER TABLE "users" ADD COLUMN "stripeCustomerId" TEXT;
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
