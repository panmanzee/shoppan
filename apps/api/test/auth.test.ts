/**
 * Integration test for the whole auth flow. "Integration" because it
 * doesn't mock the database — it hits your real local Postgres (via
 * Prisma) through supertest, which calls `app` directly in-memory
 * without needing `npm run dev` to be running in another terminal.
 *
 * Requires: `docker compose up -d` running, and a filled-in `.env`
 * (same requirements as `npm run dev`).
 *
 * Run with: npm test
 */
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@/app";
import { prisma } from "@/lib/prisma";

// Unique email per test run so re-running `npm test` never collides with
// a leftover user from a previous run that failed to clean up.
const testEmail = `test-${Date.now()}@example.com`;
const testPassword = "password123";

describe("Auth flow (Phase 1)", () => {
  afterAll(async () => {
    // Clean up the test user so the database doesn't fill up with junk
    // every time this suite runs.
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("signs up a new buyer and sets a session cookie", async () => {
    const res = await request(app).post("/auth/signup").send({
      name: "Test User",
      email: testEmail,
      password: testPassword,
      role: "BUYER",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.passwordHash).toBeUndefined(); // never leak the hash
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects a second signup with the same email", async () => {
    const res = await request(app).post("/auth/signup").send({
      name: "Test User",
      email: testEmail,
      password: testPassword,
      role: "BUYER",
    });

    expect(res.status).toBe(409);
  });

  it("rejects login with a wrong password", async () => {
    const res = await request(app).post("/auth/login").send({
      email: testEmail,
      password: "totally-wrong-password",
    });

    expect(res.status).toBe(401);
  });

  it("logs in with the correct password and can then fetch /users/me", async () => {
    const loginRes = await request(app).post("/auth/login").send({
      email: testEmail,
      password: testPassword,
    });
    expect(loginRes.status).toBe(200);

    const sessionCookie = loginRes.headers["set-cookie"];
    const meRes = await request(app).get("/users/me").set("Cookie", sessionCookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testEmail);
  });

  it("rejects /users/me when there is no session cookie at all", async () => {
    const res = await request(app).get("/users/me");
    expect(res.status).toBe(401);
  });
});
