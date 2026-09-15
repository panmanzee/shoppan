import { prisma } from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";

export function findPlanById(id: string) {
  return prisma.plan.findUnique({ where: { id } });
}

export function findSellerProfileByUserId(userId: string) {
  return prisma.sellerProfile.findUnique({ where: { userId } });
}

// A user's currently-active subscription for a given plan audience
// (BUYER or SELLER) — a user can only have one active subscription per
// audience at a time, enforced in subscriptions.service.ts.
export function findActiveSubscription(userId: string, audience: "BUYER" | "SELLER") {
  return prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      plan: { audience },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export function listSubscriptionsForUser(userId: string) {
  return prisma.subscription.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });
}

export function findSubscriptionById(id: string) {
  return prisma.subscription.findUnique({ where: { id }, include: { plan: true } });
}

export function createSubscription(data: {
  userId: string;
  planId: string;
  stripeSubscriptionId: string;
  currentPeriodEnd: Date;
}) {
  return prisma.subscription.create({
    data: { ...data, status: SubscriptionStatus.ACTIVE },
    include: { plan: true },
  });
}

export function updateSubscriptionStatus(id: string, status: SubscriptionStatus) {
  return prisma.subscription.update({ where: { id }, data: { status } });
}

// Used by checkout + product ranking to look up active SELLER-tier
// perks for a batch of seller user IDs in one query instead of N.
export function findActiveSellerSubscriptions(userIds: string[]) {
  return prisma.subscription.findMany({
    where: {
      userId: { in: userIds },
      status: SubscriptionStatus.ACTIVE,
      plan: { audience: "SELLER" },
    },
    include: { plan: true },
  });
}
