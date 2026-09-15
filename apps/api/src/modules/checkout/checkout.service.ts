/**
 * The core of Phase 2's "definition of done": a cart with items from
 * multiple sellers gets split into one Order per seller, each with its
 * own commission/payout math, all created atomically.
 *
 * Phase 3 adds perk enforcement on top, per PROJECT_INSTRUCTIONS.md:
 *   - Buyer's active subscription (if any) gives a % discount on every
 *     seller's subtotal.
 *   - Each seller's OWN active subscription (if any) lowers the
 *     commission rate charged on their sales below the platform default.
 * This is deliberately the ONE place both halves of the project (perks
 * + checkout) connect — see Phase 3's "Definition of done".
 *
 * NOTE on payment: `chargeBuyer()` is currently a STUB (see
 * src/lib/payments/paymentProvider.ts) — no real money moves yet. That
 * file is the ONLY place you'll need to touch when you're ready to wire
 * up real Stripe Connect payments; everything below stays the same.
 */
import { Product, SellerProfile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/middleware/errorHandler";
import { DEFAULT_COMMISSION_PERCENT } from "@/config/constants";
import { chargeBuyer } from "@/lib/payments/paymentProvider";
import { sendOrderConfirmation } from "@/lib/email/mailer";
import * as productsRepository from "@/modules/products/products.repository";
import * as subscriptionsRepository from "@/modules/subscriptions/subscriptions.repository";
import type { CheckoutInput } from "./checkout.schema";

type ProductWithSeller = Product & { seller: SellerProfile };

interface SellerGroup {
  sellerId: string;
  sellerUserId: string;
  lines: { product: ProductWithSeller; quantity: number }[];
}

interface PlanPerks {
  discountPercent?: number;
  commissionPercent?: number;
}

export async function checkout(buyerId: string, input: CheckoutInput) {
  const productIds = input.items.map((item) => item.productId);
  const products = (await productsRepository.findProductsByIds(productIds)) as ProductWithSeller[];

  if (products.length !== new Set(productIds).size) {
    throw ApiError.badRequest("One or more items in your cart no longer exist");
  }

  // --- Validate stock/availability and group by seller ---
  const bySeller = new Map<string, SellerGroup>();

  for (const item of input.items) {
    const product = products.find((p) => p.id === item.productId)!;

    if (!product.isActive) {
      throw ApiError.badRequest(`"${product.title}" is no longer available`);
    }
    if (product.stock < item.quantity) {
      throw ApiError.badRequest(`Not enough stock for "${product.title}"`);
    }

    const group = bySeller.get(product.sellerId) ?? {
      sellerId: product.sellerId,
      sellerUserId: product.seller.userId,
      lines: [],
    };
    group.lines.push({ product, quantity: item.quantity });
    bySeller.set(product.sellerId, group);
  }

  const sellerGroups = Array.from(bySeller.values());

  // --- Perk lookup: buyer discount + each seller's commission rate ---
  const buyerSubscription = await subscriptionsRepository.findActiveSubscription(buyerId, "BUYER");
  const discountPercent = (buyerSubscription?.plan.perks as PlanPerks | undefined)?.discountPercent ?? 0;

  const sellerUserIds = sellerGroups.map((g) => g.sellerUserId);
  const sellerSubscriptions = await subscriptionsRepository.findActiveSellerSubscriptions(sellerUserIds);
  const commissionPercentByUserId = new Map<string, number>();
  for (const sub of sellerSubscriptions) {
    const perks = sub.plan.perks as PlanPerks;
    if (perks.commissionPercent !== undefined) {
      commissionPercentByUserId.set(sub.userId, perks.commissionPercent);
    }
  }

  // --- Compute per-seller money math ---
  const orderInputs = sellerGroups.map((group) => {
    const subtotalCents = group.lines.reduce(
      (sum, line) => sum + line.product.priceCents * line.quantity,
      0
    );
    const discountCents = Math.round((subtotalCents * discountPercent) / 100);
    const payableCents = subtotalCents - discountCents;

    const commissionPercent = commissionPercentByUserId.get(group.sellerUserId) ?? DEFAULT_COMMISSION_PERCENT;
    const commissionCents = Math.round((payableCents * commissionPercent) / 100);
    const sellerPayoutCents = payableCents - commissionCents;

    return { group, subtotalCents, discountCents, payableCents, commissionCents, sellerPayoutCents };
  });

  const grandTotalCents = orderInputs.reduce((sum, o) => sum + o.payableCents, 0);

  // --- "Charge" the buyer once for the whole (discounted) cart ---
  // A real Stripe Connect integration can either charge once and split
  // via `transfer_data` per line item, or charge per seller — both are
  // valid designs. The stub just needs one successful charge to move on.
  await chargeBuyer(grandTotalCents);

  // --- Create one Order per seller + decrement stock, atomically ---
  const orders = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const o of orderInputs) {
      const order = await tx.order.create({
        data: {
          buyerId,
          sellerId: o.group.sellerId,
          status: "PAID",
          subtotalCents: o.subtotalCents,
          discountCents: o.discountCents,
          commissionCents: o.commissionCents,
          sellerPayoutCents: o.sellerPayoutCents,
          items: {
            create: o.group.lines.map((line) => ({
              productId: line.product.id,
              quantity: line.quantity,
              unitPriceCents: line.product.priceCents,
            })),
          },
        },
        include: { items: true },
      });

      for (const line of o.group.lines) {
        await tx.product.update({
          where: { id: line.product.id },
          data: { stock: { decrement: line.quantity } },
        });
      }

      created.push(order);
    }

    return created;
  });

  // Send order confirmation email (fire-and-forget — never blocks the response)
  const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
  if (buyer) {
    const allItems = orders.flatMap((o) =>
      o.items.map((item) => ({
        title: (item as any).product?.title ?? item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      }))
    );
    sendOrderConfirmation({
      buyerEmail: buyer.email,
      buyerName: buyer.name,
      orderId: orders[0].id,
      items: allItems,
      totalCents: grandTotalCents,
    }).catch(() => {}); // swallow email errors — order is already placed
  }

  return { orders, grandTotalCents };
}
