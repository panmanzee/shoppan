/**
 * Billing provider — wraps Stripe Subscriptions.
 *
 * Falls back to a stub if STRIPE_SECRET_KEY is not set (dev / test).
 *
 * Each user gets one Stripe Customer (created on first subscribe, then
 * cached in users.stripeCustomerId). Subscriptions use inline `price_data`
 * so no Stripe Dashboard products/prices need to be pre-configured.
 */
import Stripe from "stripe";
import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";

export interface BillingResult {
  success: true;
  providerSubscriptionId: string;
}

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

async function getOrCreateCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe!.customers.create({
    email: user.email,
    name: user.name,
    metadata: { kindredUserId: userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function startSubscription(planId: string, userId: string): Promise<BillingResult> {
  if (!stripe) {
    return {
      success: true,
      providerSubscriptionId: `stub_sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
  const customerId = await getOrCreateCustomer(userId);

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: plan.name, metadata: { kindredPlanId: planId } },
          unit_amount: plan.priceCents,
          recurring: { interval: "month" },
        },
      },
    ],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
    metadata: { kindredPlanId: planId, kindredUserId: userId },
  });

  return { success: true, providerSubscriptionId: subscription.id };
}

export async function cancelSubscription(providerSubscriptionId: string | null): Promise<void> {
  if (!stripe || !providerSubscriptionId) return;
  await stripe.subscriptions.cancel(providerSubscriptionId);
}
