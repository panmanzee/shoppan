import { prisma } from "@/lib/prisma";

export function findProductById(productId: string) {
  return prisma.product.findUnique({ where: { id: productId } });
}

export function findSellerById(sellerId: string) {
  return prisma.sellerProfile.findUnique({ where: { id: sellerId } });
}

export function createProductReview(data: {
  productId: string;
  authorId: string;
  rating: number;
  comment?: string;
}) {
  return prisma.productReview.create({ data });
}

export function createSellerReview(data: {
  sellerId: string;
  authorId: string;
  rating: number;
  comment?: string;
}) {
  return prisma.sellerReview.create({ data });
}

export function listProductReviews(productId: string) {
  return prisma.productReview.findMany({
    where: { productId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function listSellerReviews(sellerId: string) {
  return prisma.sellerReview.findMany({
    where: { sellerId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}
