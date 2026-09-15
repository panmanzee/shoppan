/**
 * Integration tests for Phase 3: subscribing/canceling via the real API,
 * and — the important part — that the perks actually change behavior
 * elsewhere in the app (checkout discount/commission, product ranking),
 * not just sit on a pricing page. See PROJECT_INSTRUCTIONS.md Phase 3
 * "Definition of done".
 *
 * Assumes `npm run prisma:seed` has been run at least once, since it
 * relies on the seeded "buyer-plus" and "seller-pro" plans (same
 * assumption `test/checkout.test.ts` makes about categories).
 *
 * Run with: npm test
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";
import { DEFAULT_COMMISSION_PERCENT } from "@/config/constants";

const runId = Date.now();
const buyerEmail = `perks-buyer-${runId}@example.com`;
const buyerPassword = "password123";

let categoryId: string;
let buyerPlusPlanId: string;
let sellerProPlanId: string;

let sellerProUserId: string;
let sellerProProfileId: string;
let sellerProProductId: string;

let sellerFreeUserId: string;
let sellerFreeProfileId: string;
let sellerFreeProductId: string;

let sessionCookie: string;
let buyerSubscriptionId: string;

describe("Subscriptions + perk enforcement (Phase 3)", () => {
  beforeAll(async () => {
    const buyerPlusPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "buyer-plus" } });
    buyerPlusPlanId = buyerPlusPlan.id;
    const sellerProPlan = await prisma.plan.findUniqueOrThrow({ where: { slug: "seller-pro" } });
    sellerProPlanId = sellerProPlan.id;

    const category = await prisma.category.create({
      data: { name: `Perks Test Category ${runId}`, slug: `perks-test-category-${runId}` },
    });
    categoryId = category.id;

    // --- Seller on the Pro tier (lower commission + search boost) ---
    const sellerProUser = await prisma.user.create({
      data: {
        name: "Pro Seller",
        email: `perks-seller-pro-${runId}@example.com`,
        passwordHash: "not-used-in-this-test",
        role: "SELLER",
      },
    });
    sellerProUserId = sellerProUser.id;

    const sellerProProfile = await prisma.sellerProfile.create({
      data: { userId: sellerProUserId, storeName: `Pro Seller Store ${runId}`, slug: `pro-seller-store-${runId}` },
    });
    sellerProProfileId = sellerProProfile.id;

    // Created directly via Prisma (not the /subscriptions endpoint) since
    // this test's focus is perk enforcement in checkout/listing, not the
    // subscribe endpoint itself — that's covered separately below for the
    // buyer.
    await prisma.subscription.create({
      data: {
        userId: sellerProUserId,
        planId: sellerProPlanId,
        status: "ACTIVE",
        stripeSubscriptionId: `test_stub_${runId}_seller`,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const sellerProProduct = await prisma.product.create({
      data: {
        sellerId: sellerProProfileId,
        categoryId,
        title: "Pro Seller Vase",
        description: "A vase from a Pro-tier seller.",
        priceCents: 10000, // $100.00
        stock: 10,
      },
    });
    sellerProProductId = sellerProProduct.id;

    // --- Seller on the free/Starter tier (default commission, no boost) ---
    const sellerFreeUser = await prisma.user.create({
      data: {
        name: "Free Seller",
        email: `perks-seller-free-${runId}@example.com`,
        passwordHash: "not-used-in-this-test",
        role: "SELLER",
      },
    });
    sellerFreeUserId = sellerFreeUser.id;

    const sellerFreeProfile = await prisma.sellerProfile.create({
      data: { userId: sellerFreeUserId, storeName: `Free Seller Store ${runId}`, slug: `free-seller-store-${runId}` },
    });
    sellerFreeProfileId = sellerFreeProfile.id;

    const sellerFreeProduct = await prisma.product.create({
      data: {
        sellerId: sellerFreeProfileId,
        categoryId,
        title: "Free Seller Bowl",
        description: "A bowl from a Starter-tier seller.",
        priceCents: 10000, // $100.00
        stock: 10,
      },
    });
    sellerFreeProductId = sellerFreeProduct.id;

    // --- Buyer, via the real signup endpoint ---
    const signupRes = await request(app).post("/auth/signup").send({
      name: "Perks Buyer",
      email: buyerEmail,
      password: buyerPassword,
      role: "BUYER",
    });
    expect(signupRes.status).toBe(201);
    sessionCookie = signupRes.headers["set-cookie"];
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { sellerId: { in: [sellerProProfileId, sellerFreeProfileId] } } });
    await prisma.subscription.deleteMany({
      where: { userId: { in: [sellerProUserId, sellerFreeUserId] } },
    });
    if (buyerSubscriptionId) {
      await prisma.subscription.deleteMany({ where: { id: buyerSubscriptionId } });
    }
    await prisma.product.deleteMany({ where: { id: { in: [sellerProProductId, sellerFreeProductId] } } });
    await prisma.sellerProfile.deleteMany({ where: { id: { in: [sellerProProfileId, sellerFreeProfileId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [sellerProUserId, sellerFreeUserId] } } });
    await prisma.user.deleteMany({ where: { email: buyerEmail } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.$disconnect();
  });

  it("lets the buyer subscribe to a plan through the real API", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .set("Cookie", sessionCookie)
      .send({ planId: buyerPlusPlanId });

    expect(res.status).toBe(201);
    expect(res.body.subscription.status).toBe("ACTIVE");
    expect(res.body.subscription.planId).toBe(buyerPlusPlanId);
    buyerSubscriptionId = res.body.subscription.id;
  });

  it("shows the active subscription on GET /subscriptions/me", async () => {
    const res = await request(app).get("/subscriptions/me").set("Cookie", sessionCookie);

    expect(res.status).toBe(200);
    const found = res.body.subscriptions.find((s: { id: string }) => s.id === buyerSubscriptionId);
    expect(found).toBeDefined();
    expect(found.status).toBe("ACTIVE");
  });

  it("applies the buyer's discount AND the Pro seller's lower commission in one checkout", async () => {
    const res = await request(app)
      .post("/checkout")
      .set("Cookie", sessionCookie)
      .send({ items: [{ productId: sellerProProductId, quantity: 1 }] });

    expect(res.status).toBe(201);
    const order = res.body.orders[0];

    // buyer-plus perk is 10% off, seeded in prisma/seed.ts
    expect(order.subtotalCents).toBe(10000);
    expect(order.discountCents).toBe(1000); // 10% of 10000
    const payableCents = order.subtotalCents - order.discountCents; // 9000

    // seller-pro perk is 6% commission (vs. the 12% platform default)
    const expectedCommission = Math.round(payableCents * 0.06);
    expect(order.commissionCents).toBe(expectedCommission);
    expect(order.sellerPayoutCents).toBe(payableCents - expectedCommission);
  });

  it("still applies the buyer discount but falls back to the default commission for a non-subscribed seller", async () => {
    const res = await request(app)
      .post("/checkout")
      .set("Cookie", sessionCookie)
      .send({ items: [{ productId: sellerFreeProductId, quantity: 1 }] });

    expect(res.status).toBe(201);
    const order = res.body.orders[0];

    expect(order.discountCents).toBe(1000); // buyer perk still applies
    const payableCents = order.subtotalCents - order.discountCents;
    const expectedCommission = Math.round((payableCents * DEFAULT_COMMISSION_PERCENT) / 100);
    expect(order.commissionCents).toBe(expectedCommission);
  });

  it("ranks the Pro seller's product above the free-tier seller's product in the catalog", async () => {
    const res = await request(app).get("/products").query({ pageSize: 50 });

    expect(res.status).toBe(200);
    const ids: string[] = res.body.products.map((p: { id: string }) => p.id);
    const proIndex = ids.indexOf(sellerProProductId);
    const freeIndex = ids.indexOf(sellerFreeProductId);

    expect(proIndex).toBeGreaterThanOrEqual(0);
    expect(freeIndex).toBeGreaterThanOrEqual(0);
    expect(proIndex).toBeLessThan(freeIndex);
  });

  it("lets the buyer cancel their subscription", async () => {
    const res = await request(app).post(`/subscriptions/${buyerSubscriptionId}/cancel`).set("Cookie", sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.subscription.status).toBe("CANCELED");
  });
});
