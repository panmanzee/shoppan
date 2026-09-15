import { ApiError } from "@/middleware/errorHandler";
import { slugify } from "@/lib/slugify";
import * as usersRepository from "./users.repository";
import type { BecomeSellerInput, UpdateSellerProfileInput } from "./users.schema";

export async function getMe(userId: string) {
  const user = await usersRepository.findUserWithSellerProfile(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  return user;
}

export async function becomeSeller(userId: string, input: BecomeSellerInput) {
  const user = await usersRepository.findUserWithSellerProfile(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  if (user.sellerProfile) {
    throw ApiError.conflict("You already have a seller storefront");
  }

  const baseSlug = slugify(input.storeName);
  const collisions = await usersRepository.findSlugCollisionCount(baseSlug);
  const slug = collisions === 0 ? baseSlug : `${baseSlug}-${collisions + 1}`;

  const sellerProfile = await usersRepository.createSellerProfile({
    userId,
    storeName: input.storeName,
    slug,
    bio: input.bio,
  });

  await usersRepository.upgradeUserRoleToSeller(userId);

  return sellerProfile;
}

export async function updateSellerProfile(userId: string, input: UpdateSellerProfileInput) {
  const user = await usersRepository.findUserWithSellerProfile(userId);
  if (!user?.sellerProfile) {
    throw ApiError.notFound("Seller profile not found");
  }

  const data: Parameters<typeof usersRepository.updateSellerProfile>[1] = {};
  if (input.storeName !== undefined) data.storeName = input.storeName;
  if (input.bio !== undefined) data.bio = input.bio || null;
  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl || null;
  if (input.bannerUrl !== undefined) data.bannerUrl = input.bannerUrl || null;

  return usersRepository.updateSellerProfile(userId, data);
}
