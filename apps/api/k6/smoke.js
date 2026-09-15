/**
 * Smoke test — 1 VU, 60 seconds.
 * Purpose: verify every critical endpoint responds correctly after a deploy.
 * Run: k6 run k6/smoke.js
 */
import http from "k6/http";
import { check, group, sleep } from "k6";

const BASE = __ENV.API_BASE ?? "http://localhost:4000";

export const options = {
  vus: 1,
  duration: "60s",
  thresholds: {
    // Every single check must pass
    checks: ["rate==1.0"],
    // All requests under 1s
    http_req_duration: ["p(100)<1000"],
  },
};

export default function () {
  group("Public product endpoints", () => {
    const listRes = http.get(`${BASE}/products`);
    check(listRes, {
      "GET /products 200": (r) => r.status === 200,
      "products array present": (r) => {
        const body = r.json();
        return Array.isArray(body.products);
      },
    });
    sleep(0.5);

    const productsBody = listRes.json();
    if (productsBody.products && productsBody.products.length > 0) {
      const id = productsBody.products[0].id;
      const detailRes = http.get(`${BASE}/products/${id}`);
      check(detailRes, {
        "GET /products/:id 200": (r) => r.status === 200,
        "product has title": (r) => Boolean(r.json("product.title")),
      });
      sleep(0.5);

      const simRes = http.get(`${BASE}/products/${id}/similar`);
      check(simRes, {
        "GET /products/:id/similar 200": (r) => r.status === 200,
      });
      sleep(0.5);
    }
  });

  group("Search", () => {
    const searchRes = http.get(`${BASE}/search?q=ceramic`);
    check(searchRes, {
      "GET /search 200": (r) => r.status === 200,
      "results array present": (r) => Array.isArray(r.json("results")),
    });
    sleep(0.5);
  });

  group("Sellers", () => {
    const sellersRes = http.get(`${BASE}/sellers`);
    check(sellersRes, {
      "GET /sellers 200": (r) => r.status === 200,
      "sellers array present": (r) => Array.isArray(r.json("sellers")),
    });
    sleep(0.5);

    const sellersBody = sellersRes.json();
    if (sellersBody.sellers && sellersBody.sellers.length > 0) {
      const slug = sellersBody.sellers[0].slug;
      const sellerRes = http.get(`${BASE}/sellers/${slug}`);
      check(sellerRes, {
        "GET /sellers/:slug 200": (r) => r.status === 200,
        "seller has storeName": (r) => Boolean(r.json("seller.storeName")),
      });
      sleep(0.5);
    }
  });

  group("Plans", () => {
    const plansRes = http.get(`${BASE}/plans`);
    check(plansRes, {
      "GET /plans 200": (r) => r.status === 200,
      "plans array present": (r) => Array.isArray(r.json("plans")),
    });
    sleep(0.5);
  });

  group("Categories", () => {
    const catRes = http.get(`${BASE}/categories`);
    check(catRes, {
      "GET /categories 200": (r) => r.status === 200,
    });
    sleep(0.5);
  });

  group("Auth — invalid credentials rejected", () => {
    const loginRes = http.post(
      `${BASE}/auth/login`,
      JSON.stringify({ email: "nobody@example.com", password: "wrong" }),
      { headers: { "Content-Type": "application/json" } }
    );
    check(loginRes, {
      "invalid login returns 401": (r) => r.status === 401,
    });
    sleep(0.5);
  });

  sleep(1);
}
