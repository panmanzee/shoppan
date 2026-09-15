"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Package, ShoppingBag, DollarSign } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminApi, cents, type AdminStats, type Order } from "@/lib/api-client";

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    adminApi
      .stats()
      .then(({ stats, recentOrders }) => {
        setStats(stats);
        setRecentOrders(recentOrders);
      })
      .catch((e) => setError(e?.message ?? "Failed to load admin data"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-ink/40">
        Loading…
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">Access denied</p>
        <p className="mt-2 text-sm text-ink/55">This page is only for admins.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-primary-600 hover:text-primary-700">
          Go home
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total users", value: stats!.userCount, icon: Users },
    { label: "Active listings", value: stats!.productCount, icon: Package },
    { label: "Total orders", value: stats!.orderCount, icon: ShoppingBag },
    { label: "Platform revenue", value: cents(stats!.totalRevenueCents), icon: DollarSign },
  ];

  const statusColor: Record<string, string> = {
    PAID: "bg-amber-50 text-amber-700",
    FULFILLED: "bg-emerald-50 text-emerald-700",
    CANCELED: "bg-red-50 text-red-700",
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-ink">Admin panel</h1>
        <p className="mt-1 text-sm text-ink/50">Platform overview</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl2 border border-sand bg-white p-5">
            <Icon size={18} className="text-ink/40" />
            <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
            <p className="text-xs text-ink/50">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-4 font-serif text-xl font-semibold text-ink">Recent orders</h2>
      <div className="divide-y divide-sand rounded-xl2 border border-sand bg-white">
        {recentOrders.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink/40">No orders yet.</p>
        )}
        {recentOrders.map((o) => (
          <div key={o.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink">
                #{o.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-ink/45">
                {o.seller?.storeName ?? "Unknown store"} ·{" "}
                {new Date(o.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <span className="text-sm font-semibold text-ink">
              {cents(o.sellerPayoutCents)}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusColor[o.status] ?? "bg-sand text-ink/50"
              }`}
            >
              {o.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
