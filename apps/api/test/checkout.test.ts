/**
 * Integration test for the Phase 2 "definition of done": a cart with
 * items from two different sellers must split into two separate Order
 * rows, each with correct commission math, and must decrement stock on
 * both products.
 *
 * The buyer goes through the real /auth/signup endpoint (via supertest)
 * so we get a real session cookie, exactly like a real client would.
 * The two sellers/products are seeded directly through Prisma since
 * there's no "become a seller" endpoint yet — that's fine, this test
 * only cares about checkout, not seller onboarding.
 *
 * Requires: `docker compose up -d` running, and a filled-in `.env`.
 * Run with: npm test
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { DEFAULT_COMMISSION_PERCENT } from "@/config/constants";

const runId = Date.now();
const buyerEmail = `checkout-buyer-${runId}@example.com`;
const buyerPassword = "password123";

// IDs collected during setup so afterAll can clean up precisely.
let categoryId: string;
let sellerAUserId: string;
let sellerBUserId: string;
let sellerAProfileId: string;
let sellerBProfileId: string;
let productAId: string;
let productBId: string;
let sessionCookie: string;

function expectedCommission(subtotalCents: number) {
  return Math.round((subtotalCents * DEFAULT_COMMISSION_PERCENT) / 100);
}

describe("Checkout — multi-seller split (Phase 2)", () => {
  beforeAll(async () => {
    // --- Category (products require one) ---
    const category = await prisma.category.create({
      data: { name: `Checkout Test Category ${runId}`, slug: `checkout-test-category-${runId}` },
    });
    categoryId = category.id;

    // --- Seller A + product A ---
    const sellerAUser = await prisma.user.create({
      data: {
        name: "Seller A",
        email: `checkout-seller-a-${runId}@example.com`,
        passwordHash: "not-used-in-this-test",
        role: "SELLER",
      },
    });
    sellerAUserId = sellerAUser.id;

    const sellerAProfile = await prisma.sellerProfile.create({
      data: { userId: sellerAUserId, storeName: `Seller A Store ${runId}`, slug: `seller-a-store-${runId}` },
    });
    sellerAProfileId = sellerAProfile.id;

    const productA = await prisma.product.create({
      data: {
        sellerId: sellerAProfileId,
        categoryId,
        title: "Handmade Mug",
        description: "A mug.",
        priceCents: 2000, // $20.00
        stock: 10,
      },
    });
    productAId = productA.id;

    // --- Seller B + product B ---
    const sellerBUser = await prisma.user.create({
      data: {
        name: "Seller B",
        email: `checkout-seller-b-${runId}@example.com`,
        passwordHash: "not-used-in-this-test",
        role: "SELLER",
      },
    });
    sellerBUserId = sellerBUser.id;

    const sellerBProfile = await prisma.sellerProfile.create({
      data: { userId: sellerBUserId, storeName: `Seller B Store ${runId}`, slug: `seller-b-store-${runId}` },
    });
    sellerBProfileId = sellerBProfile.id;

    const productB = await prisma.product.create({
      data: {
        sellerId: sellerBProfileId,
        categoryId,
        title: "Silver Ring",
        description: "A ring.",
        priceCents: 5000, // $50.00
        stock: 5,
      },
    });
    productBId = productB.id;

    // --- Buyer, via the real signup endpoint ---
    const signupRes = await request(app).post("/auth/signup").send({
      name: "Checkout Buyer",
      email: buyerEmail,
      password: buyerPassword,
      role: "BUYER",
    });
    expect(signupRes.status).toBe(201);
    sessionCookie = signupRes.headers["set-cookie"];
  });

  afterAll(async () => {
    // Clean up in FK-safe order: orders/items first (cascade handles
    // order_items), then products, then seller profiles, then users,
    // then the category.
    await prisma.order.deleteMany({ where: { sellerId: { in: [sellerAProfileId, sellerBProfileId] } } });
    await prisma.product.deleteMany({ where: { id: { in: [productAId, productBId] } } });
    await prisma.sellerProfile.deleteMany({ where: { id: { in: [sellerAProfileId, sellerBProfileId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [sellerAUserId, sellerBUserId] } } });
    await prisma.user.deleteMany({ where: { email: buyerEmail } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.$disconnect();
  });

  it("rejects checkout with no session cookie", async () => {
    const res = await request(app)
      .post("/checkout")
      .send({ items: [{ productId: productAId, quantity: 1 }] });

    expect(res.status).toBe(401);
  });

  it("splits a cart spanning two sellers into two orders with correct commission math", async () => {
    const res = await request(app)
      .post("/checkout")
      .set("Cookie", sessionCookie)
      .send({
        items: [
          { productId: productAId, quantity: 2 }, // 2 x $20.00 = $40.00 from Seller A
          { productId: productBId, quantity: 1 }, // 1 x $50.00 = $50.00 from Seller B
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.orders).toHaveLength(2);
    expect(res.body.grandTotalCents).toBe(9000); // $40 + $50

    const orderA = res.body.orders.find((o: { sellerId: string }) => o.sellerId === sellerAProfileId);
    const orderB = res.body.orders.find((o: { sellerId: string }) => o.sellerId === sellerBProfileId);

    expect(orderA).toBeDefined();
    expect(orderB).toBeDefined();

    expect(orderA.subtotalCents).toBe(4000);
    expect(orderA.commissionCents).toBe(expectedCommission(4000));
    expect(orderA.sellerPayoutCents).toBe(4000 - expectedCommission(4000));

    expect(orderB.subtotalCents).toBe(5000);
    expect(orderB.commissionCents).toBe(expectedCommission(5000));
    expect(orderB.sellerPayoutCents).toBe(5000 - expectedCommission(5000));
  });

  it("decremented stock on both products after checkout", async () => {
    const productA = await prisma.product.findUniqueOrThrow({ where: { id: productAId } });
    const productB = await prisma.product.findUniqueOrThrow({ where: { id: productBId } });

    expect(productA.stock).toBe(8); // 10 - 2
    expect(productB.stock).toBe(4); // 5 - 1
  });

  it("rejects checkout for a quantity that exceeds remaining stock", async () => {
    const res = await request(app)
      .post("/checkout")
      .set("Cookie", sessionCookie)
      .send({ items: [{ productId: productBId, quantity: 999 }] });

    expect(res.status).toBe(400);
  });
});
