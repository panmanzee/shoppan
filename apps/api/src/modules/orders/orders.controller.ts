import { Request, Response } from "express";
import * as ordersService from "./orders.service";
import * as ordersRepository from "./orders.repository";
import { ApiError } from "@/middleware/errorHandler";
import { prisma } from "@/lib/prisma";
import { sendFulfillmentNotification } from "@/lib/email/mailer";

export async function mine(req: Request, res: Response) {
  const orders = await ordersService.getOrdersAsBuyer(req.user!.id);
  res.json({ orders });
}

export async function selling(req: Request, res: Response) {
  const orders = await ordersService.getOrdersAsSeller(req.user!.id);
  res.json({ orders });
}

export async function fulfill(req: Request, res: Response) {
  const order = await ordersRepository.findOrderById(req.params.id);
  if (!order) throw ApiError.notFound("Order not found");

  // Only the seller who owns this order can mark it fulfilled
  if (order.seller.userId !== req.user!.id) throw ApiError.forbidden("Not your order");
  if (order.status !== "PAID") throw ApiError.badRequest("Only PAID orders can be fulfilled");

  const updated = await ordersRepository.updateOrderStatus(req.params.id, "FULFILLED");

  // Notify buyer (fire-and-forget)
  const buyer = await prisma.user.findUnique({ where: { id: order.buyerId } });
  if (buyer) {
    sendFulfillmentNotification({
      buyerEmail: buyer.email,
      buyerName: buyer.name,
      orderId: order.id,
      storeName: order.seller.storeName,
    }).catch(() => {});
  }

  res.json({ order: updated });
}
