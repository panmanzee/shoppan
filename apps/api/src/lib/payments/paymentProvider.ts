/**
 * Payment provider — wraps Stripe PaymentIntents.
 *
 * Falls back to a stub if STRIPE_SECRET_KEY is not set (dev / test).
 *
 * Production note: for Stripe Connect (split payouts to sellers), each
 * seller needs a connected Stripe account ID. Store it on SellerProfile
 * as `stripeAccountId` and pass it as `transfer_data.destination` when
 * creating the PaymentIntent for that seller's sub-total. The current
 * implementation captures a single PaymentIntent for the cart grand-total;
 * manual payouts can then be issued to sellers via the Stripe Dashboard or
 * a scheduled transfer job.
 */
import Stripe from "stripe";
import { env } from "@/config/env";

export interface ChargeResult {
  success: true;
  providerReference: string;
}

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

export async function chargeBuyer(amountCents: number): Promise<ChargeResult> {
  if (!stripe) {
    // Dev/test fallback — no real charge
    return {
      success: true,
      providerReference: `stub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
  }

  // Creates a PaymentIntent in "automatic_payment_methods" mode so the
  // front-end can confirm it with the Stripe.js client. In a full checkout
  // flow the client would receive `clientSecret` and call
  // `stripe.confirmPayment()`. The order is recorded here optimistically;
  // a webhook (invoice.paid / payment_intent.succeeded) would mark it PAID.
  const intent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { platform: "kindred" },
  });

  return { success: true, providerReference: intent.id };
}
