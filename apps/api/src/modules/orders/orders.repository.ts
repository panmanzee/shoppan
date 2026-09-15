import { prisma } from "@/lib/prisma";

export function findOrdersByBuyer(buyerId: string) {
  return prisma.order.findMany({
    where: { buyerId },
    include: { items: { include: { product: true } }, seller: true },
    orderBy: { createdAt: "desc" },
  });
}

export function findSellerProfileByUserId(userId: string) {
  return prisma.sellerProfile.findUnique({ where: { userId } });
}

export function findOrdersBySeller(sellerId: string) {
  return prisma.order.findMany({
    where: { sellerId },
    include: { items: { include: { product: true } }, buyer: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function findOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { seller: true },
  });
}

export function updateOrderStatus(id: string, status: "FULFILLED" | "CANCELED") {
  return prisma.order.update({ where: { id }, data: { status } });
}
