/**
 * Stress test — finds the system's breaking point.
 *
 * Ramps VUs aggressively to identify:
 *   - The RPS ceiling before error rate climbs
 *   - Which endpoints degrade first (typically: search > checkout > list)
 *   - Memory/connection pool exhaustion symptoms
 *
 * Run:
 *   k6 run k6/stress.js
 *   k6 run -e API_BASE=http://localhost:4000 k6/stress.js
 *
 * After running, look for the stage where http_req_failed first exceeds 1%.
 * That VU count is your current capacity limit.
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE = __ENV.API_BASE ?? "http://localhost:4000";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "1m", target: 50 },   // warm up
    { duration: "2m", target: 100 },  // moderate load
    { duration: "2m", target: 200 },  // high load — expect latency to climb
    { duration: "2m", target: 300 },  // stress — error rate may increase here
    { duration: "1m", target: 400 },  // extreme — find the breaking point
    { duration: "2m", target: 0 },    // recovery — watch errors drop back to 0
  ],
  thresholds: {
    // Informational only — stress tests are expected to breach thresholds
    http_req_duration: ["p(95)<3000"],
    errors: ["rate<0.15"],  // alert if >15% errors (system is broken, not just stressed)
  },
};

// Weighted endpoint mix reflecting production traffic distribution
const ENDPOINTS = [
  // High-frequency reads — 50% of requests
  { path: "/products", weight: 30 },
  { path: "/categories", weight: 5 },
  { path: "/plans", weight: 5 },
  { path: "/sellers", weight: 10 },
  // Search — CPU/DB intensive — 25%
  { path: "/search?q=ceramic", weight: 6 },
  { path: "/search?q=leather", weight: 5 },
  { path: "/search?q=handmade", weight: 5 },
  { path: "/search?q=candle", weight: 5 },
  { path: "/search?q=jewelry", weight: 4 },
];

// Build a weighted random selector
const TOTAL_WEIGHT = ENDPOINTS.reduce((s, e) => s + e.weight, 0);

function pickEndpoint() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const endpoint of ENDPOINTS) {
    r -= endpoint.weight;
    if (r <= 0) return endpoint.path;
  }
  return ENDPOINTS[0].path;
}

export default function () {
  const path = pickEndpoint();
  const res = http.get(`${BASE}${path}`);

  const ok = check(res, {
    "status 200": (r) => r.status === 200,
    "no server error": (r) => r.status < 500,
  });

  errorRate.add(!ok);

  // Minimal think time to maximise RPS pressure
  sleep(0.1);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.["p(95)"];
  const p99 = data.metrics.http_req_duration?.values?.["p(99)"];
  const errRate = data.metrics.errors?.values?.rate ?? 0;
  const rps = data.metrics.http_reqs?.values?.rate ?? 0;

  return {
    stdout: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Stress Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Peak RPS        : ${rps.toFixed(1)} req/s
  p95 latency     : ${p95?.toFixed(0) ?? "?"}ms
  p99 latency     : ${p99?.toFixed(0) ?? "?"}ms
  Error rate      : ${(errRate * 100).toFixed(2)}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ${errRate > 0.05 ? "⚠ System degraded under stress — check DB pool / server logs" : "✓ System handled stress without critical errors"}
`,
  };
}
