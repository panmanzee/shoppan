import { ApiError } from "@/middleware/errorHandler";
import * as productsRepository from "./products.repository";
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from "./products.schema";

async function requireSellerProfile(userId: string) {
  const sellerProfile = await productsRepository.findSellerProfileByUserId(userId);
  if (!sellerProfile) {
    // Shouldn't normally happen if requireRole(SELLER) is doing its job,
    // but a user's role can theoretically be SELLER without ever calling
    // /users/me/become-seller in some edge case — guard anyway.
    throw ApiError.forbidden("You need a seller storefront before listing products");
  }
  return sellerProfile;
}

export async function createProduct(userId: string, input: CreateProductInput) {
  const sellerProfile = await requireSellerProfile(userId);

  const category = await productsRepository.findCategoryBySlug(input.categorySlug);
  if (!category) {
    throw ApiError.badRequest(`Unknown category: ${input.categorySlug}`);
  }

  return productsRepository.createProduct({
    sellerId: sellerProfile.id,
    categoryId: category.id,
    title: input.title,
    description: input.description,
    priceCents: input.priceCents,
    imageUrl: input.imageUrl,
    stock: input.stock,
  });
}

export async function updateProduct(userId: string, productId: string, input: UpdateProductInput) {
  const product = await productsRepository.findProductById(productId);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const sellerProfile = await requireSellerProfile(userId);
  if (product.sellerId !== sellerProfile.id) {
    throw ApiError.forbidden("You can only edit your own listings");
  }

  let categoryId: string | undefined;
  if (input.categorySlug) {
    const category = await productsRepository.findCategoryBySlug(input.categorySlug);
    if (!category) {
      throw ApiError.badRequest(`Unknown category: ${input.categorySlug}`);
    }
    categoryId = category.id;
  }

  return productsRepository.updateProduct(productId, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.priceCents !== undefined ? { priceCents: input.priceCents } : {}),
    ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
    ...(input.stock !== undefined ? { stock: input.stock } : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
  });
}

export async function deleteProduct(userId: string, productId: string) {
  const product = await productsRepository.findProductById(productId);
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const sellerProfile = await requireSellerProfile(userId);
  if (product.sellerId !== sellerProfile.id) {
    throw ApiError.forbidden("You can only delete your own listings");
  }

  await productsRepository.deleteProduct(productId);
}

export async function getProduct(productId: string) {
  const product = await productsRepository.findProductById(productId);
  if (!product || !product.isActive) {
    throw ApiError.notFound("Product not found");
  }
  return product;
}

export function listProducts(query: ListProductsQuery) {
  return productsRepository.listActiveProducts({
    categorySlug: query.category,
    minPriceCents: query.minPriceCents,
    maxPriceCents: query.maxPriceCents,
    page: query.page,
    pageSize: query.pageSize,
  });
}
