"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Plan } from "@/lib/types";
import { subscriptionsApi, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function PlanCard({ plan }: { plan: Plan }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    if (!user) {
      router.push("/signup");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await subscriptionsApi.subscribe(plan.id);
      const dest = plan.audience === "seller" ? "/dashboard/seller" : "/dashboard/buyer";
      router.push(dest);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start subscription.");
      setLoading(false);
    }
  }

  const isFree = plan.price === 0;

  return (
    <div
      className={`flex flex-col rounded-xl2 border p-6 ${
        plan.highlighted
          ? "border-primary-500 bg-white shadow-card"
          : "border-sand bg-white/60"
      }`}
    >
      {plan.highlighted && (
        <span className="mb-3 w-fit rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
          Most popular
        </span>
      )}
      <p className="font-serif text-lg font-semibold text-ink">{plan.name}</p>
      <p className="mt-1 text-sm text-ink/60">{plan.tagline}</p>
      <p className="mt-5 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-ink">${plan.price}</span>
        <span className="text-sm text-ink/50">/{plan.interval}</span>
      </p>
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-ink/75">
            <Check size={16} className="mt-0.5 shrink-0 text-primary-500" />
            {f}
          </li>
        ))}
      </ul>

      {error && (
        <p className="mt-3 text-xs text-red-600">{error}</p>
      )}

      {isFree ? (
        <Link
          href={user ? "/products" : "/signup"}
          className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition border border-sand text-ink hover:bg-sand`}
        >
          Get started
        </Link>
      ) : (
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className={`mt-6 rounded-full px-4 py-2.5 text-center text-sm font-semibold transition disabled:opacity-60 ${
            plan.highlighted
              ? "bg-ink text-white hover:bg-ink/90"
              : "border border-sand text-ink hover:bg-sand"
          }`}
        >
          {loading ? "Subscribing…" : `Choose ${plan.name}`}
        </button>
      )}
    </div>
  );
}
