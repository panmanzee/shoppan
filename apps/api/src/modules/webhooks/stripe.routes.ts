import { Router } from "express";
import { stripeWebhookHandler } from "./stripe.handler";

export const stripeWebhookRouter = Router();

// express.raw() is applied at the app level specifically for this path
// (see app.ts) so that Stripe's signature verification receives the raw body.
stripeWebhookRouter.post("/webhooks/stripe", stripeWebhookHandler);
