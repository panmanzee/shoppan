import { z } from "zod";

export const becomeSellerSchema = z.object({
  body: z.object({
    storeName: z.string().min(2, "Store name must be at least 2 characters"),
    bio: z.string().max(500).optional(),
  }),
});

export type BecomeSellerInput = z.infer<typeof becomeSellerSchema>["body"];

export const updateSellerProfileSchema = z.object({
  body: z.object({
    storeName: z.string().min(2).max(60).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
    bannerUrl: z.string().url().optional().or(z.literal("")),
  }),
});

export type UpdateSellerProfileInput = z.infer<typeof updateSellerProfileSchema>["body"];
