/**
 * Integration tests for Phase 4: the recommendation engine. Builds a
 * small, deliberate interaction graph directly via Prisma (purchases +
 * a positive review + a view, spread across two "other" users) so the
 * item-item co-occurrence math in recommendations.service.ts has
 * something real to chew on, then hits the actual API endpoints:
 *   - GET /products/:id/similar        (public)
 *   - GET /recommendations/me          (requireAuth)
 * plus the view-logging side effect on GET /products/:id.
 *
 * Assumes `npm run prisma:seed` has been run at least once (same
 * assumption every other test file in this suite makes).
 *
 * Run with: npm test
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";

const runId = Date.now();

let categoryId: string;
let sellerProfileId: string;
let sellerUserId: string;

let productAlphaId: string; // purchased + reviewed by both "other" users
let productBetaId: string; // reviewed by both "other" users -> strongest co-occurrence with Alpha
let productGammaId: string; // only viewed by one "other" user -> weaker co-occurrence with Alpha
let productDeltaId: string; // same category as Alpha, zero interactions -> exercises the fallback

let otherUser1Id: string;
let otherUser2Id: string;
let orderIds: string[] = [];

let mainBuyerEmail: string;
let mainBuyerSessionCookie: string;
let mainBuyerId: string;

describe("Recommendations (Phase 4)", () => {
  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: `Recs Test Category ${runId}`, slug: `recs-test-category-${runId}` },
    });
    categoryId = category.id;

    const sellerUser = await prisma.user.create({
      data: {
        name: "Recs Seller",
        email: `recs-seller-${runId}@example.com`,
        passwordHash: "not-used-in-this-test",
        role: "SELLER",
      },
    });
    sellerUserId = sellerUser.id;

    const sellerProfile = await prisma.sellerProfile.create({
      data: { userId: sellerUserId, storeName: `Recs Seller Store ${runId}`, slug: `recs-seller-store-${runId}` },
    });
    sellerProfileId = sellerProfile.id;

    const makeProduct = (title: string) =>
      prisma.product.create({
        data: {
          sellerId: sellerProfileId,
          categoryId,
          title,
          description: `${title} description`,
          priceCents: 5000,
          stock: 10,
        },
      });

    const [productAlpha, productBeta, productGamma, productDelta] = await Promise.all([
      makeProduct(`Alpha ${runId}`),
      makeProduct(`Beta ${runId}`),
      makeProduct(`Gamma ${runId}`),
      makeProduct(`Delta ${runId}`),
    ]);
    productAlphaId = productAlpha.id;
    productBetaId = productBeta.id;
    productGammaId = productGamma.id;
    productDeltaId = productDelta.id;

    // --- Two "other" users whose combined behavior forms the signal ---
    // Both buy Alpha and positively review Beta -> Alpha<->Beta gets the
    // strongest co-occurrence. Only one of them also views Gamma -> a
    // weaker Alpha<->Gamma / Beta<->Gamma link. Delta is never touched by
    // anyone, so it only shows up via the same-category fallback.
    const [otherUser1, otherUser2] = await Promise.all([
      prisma.user.create({
        data: {
          name: "Signal Buyer One",
          email: `recs-signal-1-${runId}@example.com`,
          passwordHash: "not-used-in-this-test",
          role: "BUYER",
        },
      }),
      prisma.user.create({
        data: {
          name: "Signal Buyer Two",
          email: `recs-signal-2-${runId}@example.com`,
          passwordHash: "not-used-in-this-test",
          role: "BUYER",
        },
      }),
    ]);
    otherUser1Id = otherUser1.id;
    otherUser2Id = otherUser2.id;

    const makeAlphaOrder = (buyerId: string) =>
      prisma.order.create({
        data: {
          buyerId,
          sellerId: sellerProfileId,
          status: "PAID",
          subtotalCents: 5000,
          commissionCents: 600,
          sellerPayoutCents: 4400,
          items: { create: [{ productId: productAlphaId, quantity: 1, unitPriceCents: 5000 }] },
        },
      });

    const order1 = await makeAlphaOrder(otherUser1Id);
    const order2 = await makeAlphaOrder(otherUser2Id);
    orderIds = [order1.id, order2.id];

    await prisma.productReview.createMany({
      data: [
        { productId: productBetaId, authorId: otherUser1Id, rating: 5 },
        { productId: productBetaId, authorId: otherUser2Id, rating: 4 },
      ],
    });

    await prisma.productView.create({
      data: { userId: otherUser1Id, productId: productGammaId },
    });

    // --- The buyer under test, via the real signup endpoint ---
    mainBuyerEmail = `recs-main-buyer-${runId}@example.com`;
    const signupRes = await request(app).post("/auth/signup").send({
      name: "Recs Main Buyer",
      email: mainBuyerEmail,
      password: "password123",
      role: "BUYER",
    });
    expect(signupRes.status).toBe(201);
    mainBuyerSessionCookie = signupRes.headers["set-cookie"];
    mainBuyerId = signupRes.body.user.id;

    // Give the main buyer their own purchase of Alpha, so
    // GET /recommendations/me has something to seed off of.
    const mainBuyerOrder = await makeAlphaOrder(mainBuyerId);
    orderIds.push(mainBuyerOrder.id);
  });

  afterAll(async () => {
    await prisma.productView.deleteMany({
      where: { userId: { in: [otherUser1Id, otherUser2Id, mainBuyerId] } },
    });
    await prisma.productReview.deleteMany({ where: { authorId: { in: [otherUser1Id, otherUser2Id] } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.product.deleteMany({
      where: { id: { in: [productAlphaId, productBetaId, productGammaId, productDeltaId] } },
    });
    await prisma.sellerProfile.deleteMany({ where: { id: sellerProfileId } });
    await prisma.user.deleteMany({ where: { id: { in: [sellerUserId, otherUser1Id, otherUser2Id, mainBuyerId] } } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
    await prisma.$disconnect();
  });

  it("ranks Beta above Gamma as 'similar' to Alpha, based on co-occurrence strength", async () => {
    const res = await request(app).get(`/products/${productAlphaId}/similar`);

    expect(res.status).toBe(200);
    const ids: string[] = res.body.products.map((p: { id: string }) => p.id);
    const betaIndex = ids.indexOf(productBetaId);
    const gammaIndex = ids.indexOf(productGammaId);

    expect(betaIndex).toBeGreaterThanOrEqual(0);
    expect(gammaIndex).toBeGreaterThanOrEqual(0);
    expect(betaIndex).toBeLessThan(gammaIndex);
  });

  it("falls back to same-category products for a product with no interaction data", async () => {
    const res = await request(app).get(`/products/${productDeltaId}/similar`);

    expect(res.status).toBe(200);
    const ids: string[] = res.body.products.map((p: { id: string }) => p.id);
    // Delta has zero co-occurrence data, so everything it returns must
    // come from the same-category fallback (Alpha/Beta/Gamma are all in
    // the same seeded category, Delta itself is excluded).
    expect(ids).not.toContain(productDeltaId);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("requires auth for GET /recommendations/me", async () => {
    const res = await request(app).get("/recommendations/me");
    expect(res.status).toBe(401);
  });

  it("recommends Beta to the signed-in buyer based on their purchase of Alpha", async () => {
    const res = await request(app).get("/recommendations/me").set("Cookie", mainBuyerSessionCookie);

    expect(res.status).toBe(200);
    const ids: string[] = res.body.products.map((p: { id: string }) => p.id);
    expect(ids).toContain(productBetaId);
    // Never recommend something the buyer already has an interaction with.
    expect(ids).not.toContain(productAlphaId);
  });

  it("logs a product view for a signed-in visitor on GET /products/:id", async () => {
    const before = await prisma.productView.count({
      where: { userId: mainBuyerId, productId: productGammaId },
    });

    const res = await request(app).get(`/products/${productGammaId}`).set("Cookie", mainBuyerSessionCookie);
    expect(res.status).toBe(200);

    // View logging is fire-and-forget (doesn't block the response), so
    // give it a beat to land before asserting on it.
    await new Promise((resolve) => setTimeout(resolve, 100));

    const after = await prisma.productView.count({
      where: { userId: mainBuyerId, productId: productGammaId },
    });
    expect(after).toBe(before + 1);
  });

  it("does not log a view for an anonymous (logged-out) visitor", async () => {
    const before = await prisma.productView.count({ where: { productId: productBetaId } });

    const res = await request(app).get(`/products/${productBetaId}`);
    expect(res.status).toBe(200);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const after = await prisma.productView.count({ where: { productId: productBetaId } });
    expect(after).toBe(before);
  });
});
