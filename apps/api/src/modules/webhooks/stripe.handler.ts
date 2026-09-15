/**
 * Stripe webhook event handler.
 *
 * Stripe sends signed POST requests here when billing events occur. We
 * verify the signature (using the raw body — NOT the parsed JSON), then
 * update subscription/invoice state in our DB to stay in sync with Stripe.
 *
 * Events handled:
 *   invoice.paid                    → mark subscription ACTIVE, record Invoice
 *   invoice.payment_failed          → mark subscription PAST_DUE
 *   customer.subscription.updated   → refresh currentPeriodEnd
 *   customer.subscription.deleted   → mark subscription CANCELED
 */
import type { Request, Response } from "express";
import Stripe from "stripe";
import { env } from "@/config/env";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" })
  : null;

export async function stripeWebhookHandler(req: Request, res: Response) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    // Stripe not configured — acknowledge and skip
    return res.json({ received: true });
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  let event: Stripe.Event;
  try {
    // req.body is a Buffer here because the route uses express.raw()
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.warn({ err }, "Stripe webhook signature verification failed");
    return res.status(400).json({ error: "Webhook signature invalid" });
  }

  try {
    switch (event.type) {
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;
        if (!stripeSubId) break;

        const sub = await prisma.subscription.findFirst({
          where: { stripeSubscriptionId: stripeSubId },
        });
        if (!sub) break;

        await prisma.$transaction([
          prisma.subscription.update({
            where: { id: sub.id },
            data: { status: "ACTIVE" },
          }),
          prisma.invoice.create({
            data: {
              subscriptionId: sub.id,
              status: "PAID",
              amountCents: invoice.amount_paid,
              stripeInvoiceId: invoice.id,
              issuedAt: new Date(invoice.created * 1000),
            },
          }),
        ]);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;
        if (!stripeSubId) break;

        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubId },
          data: { status: "PAST_DUE" },
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: {
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            status: sub.status === "active" ? "ACTIVE"
              : sub.status === "past_due" ? "PAST_DUE"
              : sub.status === "trialing" ? "TRIALING"
              : "CANCELED",
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: sub.id },
          data: { status: "CANCELED" },
        });
        break;
      }

      default:
        // Unhandled event — ignore silently
        break;
    }
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Error processing Stripe webhook");
    // Return 200 so Stripe doesn't retry — we've logged the error internally
  }

  return res.json({ received: true });
}
