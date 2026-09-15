"use client";

import { useState, useEffect } from "react";
import PlanCard from "@/components/PlanCard";
import { plansApi, type Plan as ApiPlan } from "@/lib/api-client";
import type { Plan } from "@/lib/types";

// UI display metadata by plan slug — features/taglines are presentation concerns,
// not stored in the DB schema.
const PLAN_DISPLAY: Record<string, { tagline: string; features: string[]; highlighted: boolean }> = {
  "buyer-free": {
    tagline: "Browse and shop the full marketplace",
    features: ["Full marketplace access", "Standard shipping rates", "Order tracking", "Save favorite shops"],
    highlighted: false,
  },
  "buyer-plus": {
    tagline: "For people who shop small often",
    features: [
      "Free shipping on every order",
      "Early access to new drops & sales",
      "10% member discount storewide",
      "Ad-free browsing",
      "60-day extended returns",
    ],
    highlighted: true,
  },
  "seller-starter": {
    tagline: "Everything you need to open your shop",
    features: ["Up to 25 active listings", "12% commission per sale", "Standard search placement", "Basic sales summary"],
    highlighted: false,
  },
  "seller-pro": {
    tagline: "For shops ready to grow",
    features: [
      "Unlimited listings",
      "6% commission per sale",
      "Priority placement in search & category pages",
      "Full analytics dashboard",
      "Run promotions & discount codes",
    ],
    highlighted: true,
  },
};

function toDisplayPlan(apiPlan: ApiPlan): Plan | null {
  const display = PLAN_DISPLAY[apiPlan.slug];
  if (!display) return null;
  return {
    id: apiPlan.id,
    audience: apiPlan.audience.toLowerCase() as "buyer" | "seller",
    name: apiPlan.name,
    price: apiPlan.priceCents / 100,
    interval: "mo",
    ...display,
  };
}

export default function PricingPage() {
  const [audience, setAudience] = useState<"buyer" | "seller">("buyer");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    plansApi
      .list()
      .then(({ plans: apiPlans }) => {
        setPlans(apiPlans.flatMap((p) => toDisplayPlan(p) ?? []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = plans.filter((p) => p.audience === audience);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-semibold text-ink">Membership plans</h1>
      <p className="mx-auto mt-3 max-w-md text-sm text-ink/55">
        Whether you shop small or run a small shop, Shoppan+ gives you more
        for showing up often.
      </p>

      <div className="mx-auto mt-8 inline-flex rounded-full border border-sand bg-white p-1">
        <button
          onClick={() => setAudience("buyer")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            audience === "buyer" ? "bg-ink text-white" : "text-ink/60"
          }`}
        >
          For buyers
        </button>
        <button
          onClick={() => setAudience("seller")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
            audience === "seller" ? "bg-ink text-white" : "text-ink/60"
          }`}
        >
          For sellers
        </button>
      </div>

      <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-6 text-left sm:grid-cols-2">
        {loading && (
          <p className="col-span-2 py-12 text-center text-sm text-ink/40">Loading plans…</p>
        )}
        {!loading && shown.map((p) => (
          <PlanCard key={p.id} plan={p} />
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-md text-xs text-ink/40">
        Cancel anytime.{" "}
        {audience === "seller"
          ? "Commission rate applies to the item price only, not shipping."
          : "Free shipping applies to standard delivery within your region."}
      </p>
    </div>
  );
}
