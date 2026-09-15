/**
 * Subscribing is deliberately simple: at most ONE active subscription
 * per audience (BUYER tier, SELLER tier) per user, so perk math in
 * checkout.service.ts and products.repository.ts never has to reason
 * about stacked/conflicting discounts. Subscribing to a new tier
 * auto-cancels the old one in the same audience (an upgrade/downgrade,
 * not a stack) — a real Stripe integration would do proration here
 * instead, see PROJECT_INSTRUCTIONS.md Phase 3.
 */
import { ApiError } from "@/middleware/errorHandler";
import * as subscriptionsRepository from "./subscriptions.repository";
import * as billingProvider from "@/lib/billing/billingProvider";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function subscribe(userId: string, userRole: string, planId: string) {
  const plan = await subscriptionsRepository.findPlanById(planId);
  if (!plan) {
    throw ApiError.notFound("Plan not found");
  }

  if (plan.audience === "SELLER") {
    const sellerProfile = await subscriptionsRepository.findSellerProfileByUserId(userId);
    if (!sellerProfile) {
      throw ApiError.forbidden("You need a seller storefront before subscribing to a seller plan");
    }
  }

  // Auto-cancel any existing active subscription in the same audience
  // (upgrade/downgrade flow, not a stack of discounts).
  const existing = await subscriptionsRepository.findActiveSubscription(userId, plan.audience);
  if (existing) {
    await subscriptionsRepository.updateSubscriptionStatus(existing.id, "CANCELED");
  }

  const billingResult = await billingProvider.startSubscription(plan.id, userId);

  return subscriptionsRepository.createSubscription({
    userId,
    planId: plan.id,
    stripeSubscriptionId: billingResult.providerSubscriptionId,
    currentPeriodEnd: new Date(Date.now() + THIRTY_DAYS_MS),
  });
}

export async function getMine(userId: string) {
  return subscriptionsRepository.listSubscriptionsForUser(userId);
}

export async function cancel(userId: string, subscriptionId: string) {
  const subscription = await subscriptionsRepository.findSubscriptionById(subscriptionId);
  if (!subscription || subscription.userId !== userId) {
    throw ApiError.notFound("Subscription not found");
  }
  if (subscription.status !== "ACTIVE") {
    throw ApiError.badRequest("This subscription isn't active");
  }

  await billingProvider.cancelSubscription(subscription.stripeSubscriptionId);
  return subscriptionsRepository.updateSubscriptionStatus(subscriptionId, "CANCELED");
}
