"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package, CreditCard, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ordersApi, subscriptionsApi, ApiError, cents, productImage, type Order, type Subscription } from "@/lib/api-client";

const STATUS_STYLE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700",
  FULFILLED: "bg-primary-50 text-primary-700",
  PENDING: "bg-amber-50 text-amber-700",
  CANCELED: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  PAID: "Confirmed",
  FULFILLED: "Delivered",
  PENDING: "Pending",
  CANCELED: "Canceled",
};

export default function BuyerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      ordersApi.mine().then((d) => setOrders(d.orders)),
      subscriptionsApi.mine().then((d) => setSubscriptions(d.subscriptions)),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-sm text-ink/40">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">Please log in</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
          Log in
        </Link>
      </div>
    );
  }

  async function handleCancel(subId: string) {
    if (!confirm("Cancel your membership? You'll keep access until the end of the billing period.")) return;
    setCancellingId(subId);
    setCancelError("");
    try {
      await subscriptionsApi.cancel(subId);
      setSubscriptions((prev) => prev.map((s) => s.id === subId ? { ...s, status: "CANCELED" as const } : s));
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : "Could not cancel membership.");
    } finally {
      setCancellingId(null);
    }
  }

  const activeSub = subscriptions.find((s) => s.status === "ACTIVE");
  const totalSpent = orders.reduce((sum, o) => sum + (o.subtotalCents - o.discountCents), 0);
  const totalSaved = orders.reduce((sum, o) => sum + o.discountCents, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Hi, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-ink/50">Here&apos;s your account overview</p>
        </div>
        {activeSub && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
            <Sparkles size={13} /> {activeSub.plan.name} member
          </span>
        )}
      </div>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl2 border border-sand bg-white p-5">
          <Package size={18} className="text-ink/40" />
          <p className="mt-3 text-2xl font-semibold text-ink">{orders.length}</p>
          <p className="text-xs text-ink/50">Total orders</p>
        </div>
        <div className="rounded-xl2 border border-sand bg-white p-5">
          <CreditCard size={18} className="text-ink/40" />
          <p className="mt-3 text-2xl font-semibold text-ink">{cents(totalSpent)}</p>
          <p className="text-xs text-ink/50">Total spent</p>
        </div>
        <div className="rounded-xl2 border border-sand bg-white p-5">
          <Sparkles size={18} className="text-ink/40" />
          <p className="mt-3 text-2xl font-semibold text-ink">{cents(totalSaved)}</p>
          <p className="text-xs text-ink/50">Saved with membership</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-ink">Recent orders</h2>
        <Link href="/products" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
          Shop again →
        </Link>
      </div>

      <div className="mt-4 divide-y divide-sand rounded-xl2 border border-sand bg-white">
        {orders.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink/40">No orders yet.</p>
        )}
        {orders.map((o) => (
          <div key={o.id} className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">Order #{o.id.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-ink/45">
                  {new Date(o.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {o.seller && ` · ${o.seller.storeName}`}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[o.status] ?? "bg-sand text-ink"}`}>
                {STATUS_LABEL[o.status] ?? o.status}
              </span>
              <span className="w-16 text-right text-sm font-semibold text-ink">
                {cents(o.subtotalCents - o.discountCents)}
              </span>
            </div>
            {o.items.length > 0 && (
              <div className="mt-3 flex gap-2">
                {o.items.slice(0, 4).map((item) => (
                  item.product && (
                    <div key={item.id} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-sand">
                      <Image
                        src={productImage(item.product, 96)}
                        alt={item.product.title}
                        fill
                        className="object-cover"
                        unoptimized
                        title={item.product.title}
                      />
                    </div>
                  )
                ))}
                {o.items.length > 4 && (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sand text-xs font-medium text-ink/50">
                    +{o.items.length - 4}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {activeSub ? (
        <div className="mt-8 rounded-xl2 border border-primary-100 bg-primary-50 p-5">
          <p className="text-sm font-semibold text-ink">Your {activeSub.plan.name} membership</p>
          {activeSub.currentPeriodEnd && (
            <p className="mt-1 text-xs text-ink/55">
              Renews {new Date(activeSub.currentPeriodEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {cancelError && <p className="mt-2 text-xs text-red-600">{cancelError}</p>}
          <div className="mt-3 flex gap-3">
            <Link href="/pricing" className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-white/80">
              Change plan
            </Link>
            <button
              onClick={() => handleCancel(activeSub.id)}
              disabled={cancellingId === activeSub.id}
              className="rounded-full border border-primary-200 px-4 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-60"
            >
              {cancellingId === activeSub.id ? "Cancelling…" : "Cancel membership"}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-xl2 border border-sand bg-white p-5">
          <p className="text-sm font-semibold text-ink">Join Shoppan+</p>
          <p className="mt-1 text-xs text-ink/55">Get 10% off every order, free shipping, and early access to new drops — $6/mo.</p>
          <Link href="/pricing" className="mt-3 inline-block rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink/90">
            See plans
          </Link>
        </div>
      )}
    </div>
  );
}
