import { prisma } from "@/lib/prisma";

export function findUserWithSellerProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { sellerProfile: true },
  });
}

export function createSellerProfile(data: {
  userId: string;
  storeName: string;
  slug: string;
  bio?: string;
}) {
  return prisma.sellerProfile.create({ data });
}

export function upgradeUserRoleToSeller(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { role: "SELLER" },
  });
}

export function updateSellerProfile(
  userId: string,
  data: { storeName?: string; bio?: string; avatarUrl?: string | null; bannerUrl?: string | null }
) {
  return prisma.sellerProfile.update({ where: { userId }, data });
}

export function findSlugCollisionCount(slugPrefix: string) {
  return prisma.sellerProfile.count({
    where: { slug: { startsWith: slugPrefix } },
  });
}
