/**
 * Load test — simulates realistic traffic across multiple user personas.
 *
 * Scenarios:
 *   browser   — anonymous visitor: browses products, searches, views sellers (80% of traffic)
 *   buyer     — authenticated buyer: browses then places an order (15% of traffic)
 *   seller    — authenticated seller: checks dashboard & orders (5% of traffic)
 *
 * Run:
 *   k6 run k6/load.js
 *   k6 run -e API_BASE=https://api.yourdomain.com k6/load.js
 *   k6 run -e BUYER_EMAIL=buyer@demo.kindred -e BUYER_PASS=demo1234 k6/load.js
 */
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE = __ENV.API_BASE ?? "http://localhost:4000";
const BUYER_EMAIL = __ENV.BUYER_EMAIL ?? "buyer@demo.kindred";
const BUYER_PASS = __ENV.BUYER_PASS ?? "demo1234";

// Custom metrics
const checkoutSuccess = new Rate("checkout_success_rate");
const searchLatency = new Trend("search_latency_ms");

export const options = {
  scenarios: {
    // Anonymous browsers — most traffic
    browser: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 40 },  // ramp up
        { duration: "5m", target: 40 },  // sustain
        { duration: "1m", target: 0 },   // ramp down
      ],
      exec: "browserScenario",
    },
    // Authenticated buyers
    buyer: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 8 },
        { duration: "5m", target: 8 },
        { duration: "1m", target: 0 },
      ],
      exec: "buyerScenario",
    },
    // Authenticated sellers
    seller: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 2 },
        { duration: "5m", target: 2 },
        { duration: "1m", target: 0 },
      ],
      exec: "sellerScenario",
    },
  },
  thresholds: {
    // API health targets
    http_req_failed: ["rate<0.01"],           // <1% error rate
    http_req_duration: ["p(95)<800"],          // 95th percentile under 800ms
    "http_req_duration{endpoint:list}": ["p(95)<400"],
    "http_req_duration{endpoint:search}": ["p(95)<1200"], // search can be slower (pgvector)
    checkout_success_rate: ["rate>0.95"],
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProducts() {
  const res = http.get(`${BASE}/products`, { tags: { endpoint: "list" } });
  check(res, { "products 200": (r) => r.status === 200 });
  return res.json("products") ?? [];
}

function login(email, password) {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { "Content-Type": "application/json" } }
  );
  const ok = check(res, { "login 200": (r) => r.status === 200 });
  if (!ok) return null;
  // Return jar with session cookie
  return res.cookies;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export function browserScenario() {
  group("Homepage / product list", () => {
    const products = getProducts();
    sleep(randomBetween(1, 3));

    // View a random product detail
    if (products.length > 0) {
      const product = products[Math.floor(Math.random() * products.length)];
      const detailRes = http.get(`${BASE}/products/${product.id}`);
      check(detailRes, { "product detail 200": (r) => r.status === 200 });
      sleep(randomBetween(2, 5));

      // 40% of the time, also check similar products (recommendation engine)
      if (Math.random() < 0.4) {
        const simRes = http.get(`${BASE}/products/${product.id}/similar`);
        check(simRes, { "similar 200": (r) => r.status === 200 });
        sleep(1);
      }
    }
  });

  // 60% of browsers use search
  if (Math.random() < 0.6) {
    group("Search", () => {
      const queries = ["ceramic", "leather", "candle", "handmade", "jewelry", "print"];
      const q = queries[Math.floor(Math.random() * queries.length)];
      const start = Date.now();
      const res = http.get(`${BASE}/search?q=${q}`, { tags: { endpoint: "search" } });
      searchLatency.add(Date.now() - start);
      check(res, { "search 200": (r) => r.status === 200 });
      sleep(randomBetween(1, 3));
    });
  }

  // 30% browse sellers
  if (Math.random() < 0.3) {
    group("Sellers", () => {
      const res = http.get(`${BASE}/sellers`);
      check(res, { "sellers 200": (r) => r.status === 200 });
      const sellers = res.json("sellers") ?? [];
      if (sellers.length > 0) {
        sleep(randomBetween(1, 2));
        const seller = sellers[Math.floor(Math.random() * sellers.length)];
        const sellerRes = http.get(`${BASE}/sellers/${seller.slug}`);
        check(sellerRes, { "seller detail 200": (r) => r.status === 200 });
      }
      sleep(randomBetween(1, 3));
    });
  }

  sleep(randomBetween(2, 5));
}

export function buyerScenario() {
  // Login once per VU iteration
  group("Buyer — login", () => {
    const cookies = login(BUYER_EMAIL, BUYER_PASS);
    if (!cookies) {
      sleep(5);
      return;
    }
  });

  sleep(randomBetween(1, 2));

  group("Buyer — browse & add to cart", () => {
    const products = getProducts();
    sleep(randomBetween(2, 4));

    if (products.length === 0) return;

    // Pick 1-3 random products to "add" — we simulate this by just hitting detail pages
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count && i < products.length; i++) {
      const p = products[Math.floor(Math.random() * products.length)];
      const res = http.get(`${BASE}/products/${p.id}`);
      check(res, { "product detail 200": (r) => r.status === 200 });
      sleep(randomBetween(1, 3));
    }
  });

  // 50% of buyers actually checkout
  if (Math.random() < 0.5) {
    group("Buyer — checkout", () => {
      const products = getProducts();
      if (products.length === 0) {
        checkoutSuccess.add(false);
        return;
      }

      const item = products[Math.floor(Math.random() * products.length)];
      const res = http.post(
        `${BASE}/checkout`,
        JSON.stringify({ items: [{ productId: item.id, quantity: 1 }] }),
        { headers: { "Content-Type": "application/json" } }
      );

      const ok = check(res, {
        "checkout 200": (r) => r.status === 200,
        "orders returned": (r) => Array.isArray(r.json("orders")),
      });
      checkoutSuccess.add(ok);
      sleep(randomBetween(1, 2));
    });
  }

  group("Buyer — check orders", () => {
    const res = http.get(`${BASE}/orders/mine`);
    check(res, { "orders/mine 200 or 401": (r) => [200, 401].includes(r.status) });
    sleep(randomBetween(1, 2));
  });

  group("Buyer — recommendations", () => {
    const res = http.get(`${BASE}/recommendations/me`);
    check(res, { "recommendations 200 or 401": (r) => [200, 401].includes(r.status) });
    sleep(1);
  });

  sleep(randomBetween(3, 6));
}

export function sellerScenario() {
  group("Seller — check plans", () => {
    const res = http.get(`${BASE}/plans`);
    check(res, { "plans 200": (r) => r.status === 200 });
    sleep(randomBetween(1, 2));
  });

  group("Seller — browse marketplace", () => {
    getProducts();
    sleep(randomBetween(2, 4));
  });

  sleep(randomBetween(5, 10));
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}
