import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(120),
    description: z.string().min(10).max(5000),
    priceCents: z.number().int().positive(),
    categorySlug: z.string().min(1),
    // Placeholder image URL for now — no S3 upload yet (see Product.imageUrl
    // comment in schema.prisma). Optional so a listing can be saved and
    // have an image added later.
    imageUrl: z.string().url().optional(),
    stock: z.number().int().nonnegative().default(0),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    title: z.string().min(3).max(120).optional(),
    description: z.string().min(10).max(5000).optional(),
    priceCents: z.number().int().positive().optional(),
    categorySlug: z.string().min(1).optional(),
    imageUrl: z.string().url().optional(),
    stock: z.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const listProductsSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    minPriceCents: z.coerce.number().int().nonnegative().optional(),
    maxPriceCents: z.coerce.number().int().nonnegative().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(50).default(20),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
export type ListProductsQuery = z.infer<typeof listProductsSchema>["query"];
