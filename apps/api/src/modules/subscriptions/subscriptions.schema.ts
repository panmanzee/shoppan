import { z } from "zod";

export const subscribeSchema = z.object({
  body: z.object({
    planId: z.string(),
  }),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>["body"];

export const cancelSubscriptionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});
