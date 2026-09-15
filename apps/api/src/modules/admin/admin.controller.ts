import { Request, Response } from "express";
import { prisma } from "@/lib/prisma";

export async function stats(req: Request, res: Response) {
  const [userCount, productCount, orderCount, revenueAgg, recentOrders] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { sellerPayoutCents: true } }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        seller: { select: { storeName: true } },
        items: { include: { product: { select: { title: true } } } },
      },
    }),
  ]);

  res.json({
    stats: {
      userCount,
      productCount,
      orderCount,
      totalRevenueCents: revenueAgg._sum.sellerPayoutCents ?? 0,
    },
    recentOrders,
  });
}
