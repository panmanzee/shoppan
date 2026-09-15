import { ApiError } from "@/middleware/errorHandler";
import * as reviewsRepository from "./reviews.repository";
import type { CreateReviewInput } from "./reviews.schema";

export async function addProductReview(
  productId: string,
  authorId: string,
  input: CreateReviewInput
) {
  const product = await reviewsRepository.findProductById(productId);
  if (!product) throw ApiError.notFound("Product not found");

  try {
    return await reviewsRepository.createProductReview({
      productId,
      authorId,
      rating: input.rating,
      comment: input.comment,
    });
  } catch (err) {
    // Prisma throws P2002 on the @@unique([productId, authorId]) constraint.
    if (isUniqueConstraintError(err)) {
      throw ApiError.conflict("You already reviewed this product");
    }
    throw err;
  }
}

export async function addSellerReview(
  sellerId: string,
  authorId: string,
  input: CreateReviewInput
) {
  const seller = await reviewsRepository.findSellerById(sellerId);
  if (!seller) throw ApiError.notFound("Seller not found");

  try {
    return await reviewsRepository.createSellerReview({
      sellerId,
      authorId,
      rating: input.rating,
      comment: input.comment,
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      throw ApiError.conflict("You already reviewed this seller");
    }
    throw err;
  }
}

export function listProductReviews(productId: string) {
  return reviewsRepository.listProductReviews(productId);
}

export function listSellerReviews(sellerId: string) {
  return reviewsRepository.listSellerReviews(sellerId);
}

function isUniqueConstraintError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}
