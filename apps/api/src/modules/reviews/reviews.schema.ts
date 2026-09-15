import { z } from "zod";

export const createReviewSchema = z.object({
  params: z.object({ id: z.string() }), // productId or sellerId, depending on the route
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>["body"];
