"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, Package, TrendingUp, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usersApi, ApiError } from "@/lib/api-client";

const PERKS = [
  { icon: Store, text: "Your own storefront with a custom URL" },
  { icon: Package, text: "List up to 25 products on the free plan" },
  { icon: TrendingUp, text: "Real-time sales dashboard and analytics" },
  { icon: Sparkles, text: "Priority search placement with Pro plan" },
];

export default function BecomeSellerPage() {
  const { user, isLoading, refresh } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isLoading) return null;

  // Already a seller with a profile — redirect them
  if (user?.sellerProfile) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">You already have a shop!</p>
        <Link
          href="/dashboard/seller"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90"
        >
          Go to your dashboard
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">Log in to open your shop</p>
        <p className="mt-2 text-sm text-ink/55">Create an account or log in, then come back here.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-sand px-6 py-3 text-sm font-semibold text-ink hover:bg-sand"
          >
            Sign up
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await usersApi.becomeSeller({ storeName: storeName.trim(), bio: bio.trim() || undefined });
      await refresh();
      window.location.href = "/dashboard/seller";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not open your shop. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-start">
        {/* Left — value prop */}
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
            <Sparkles size={12} /> Free to open
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight text-ink">
            Turn your craft into a shop.
          </h1>
          <p className="mt-4 text-base text-ink/60">
            Shoppan connects independent makers with people who love handmade goods.
            Open your shop in under two minutes — no listing fees to start.
          </p>

          <ul className="mt-10 space-y-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50">
                  <Icon size={16} className="text-primary-600" />
                </div>
                <p className="mt-1 text-sm text-ink/75">{text}</p>
              </li>
            ))}
          </ul>

          <p className="mt-10 text-xs text-ink/40">
            By opening a shop you agree to our seller terms. 12% commission on the Starter plan, 6% on Pro.
          </p>
        </div>

        {/* Right — form */}
        <div className="rounded-xl2 border border-sand bg-white p-8 shadow-card">
          <h2 className="font-serif text-2xl font-semibold text-ink">Open your shop</h2>
          <p className="mt-1 text-sm text-ink/50">You can change these details any time.</p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">
                Shop name <span className="text-red-400">*</span>
              </label>
              <input
                required
                minLength={2}
                maxLength={60}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="e.g. Willow & Clay Studio"
                className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
              />
              <p className="mt-1 text-xs text-ink/40">
                This is the name buyers will see. Make it memorable.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">
                Shop bio <span className="text-ink/30">(optional)</span>
              </label>
              <textarea
                rows={3}
                maxLength={300}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell buyers a little about your craft, materials, or process…"
                className="w-full resize-none rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !storeName.trim()}
              className="w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
            >
              {loading ? "Opening your shop…" : "Open my shop"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
