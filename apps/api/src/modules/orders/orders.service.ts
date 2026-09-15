import { ApiError } from "@/middleware/errorHandler";
import * as ordersRepository from "./orders.repository";

export function getOrdersAsBuyer(buyerId: string) {
  return ordersRepository.findOrdersByBuyer(buyerId);
}

export async function getOrdersAsSeller(userId: string) {
  const sellerProfile = await ordersRepository.findSellerProfileByUserId(userId);
  if (!sellerProfile) {
    throw ApiError.forbidden("You don't have a seller storefront");
  }
  return ordersRepository.findOrdersBySeller(sellerProfile.id);
}
