import { z } from "zod";

export const checkoutSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          productId: z.string(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1, "Your cart is empty"),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>["body"];
