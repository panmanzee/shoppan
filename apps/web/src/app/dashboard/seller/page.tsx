"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { DollarSign, Package, TrendingUp, Plus, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ordersApi, productsApi, subscriptionsApi, cents, productImage, type Order, type Product, type Subscription } from "@/lib/api-client";

export default function SellerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      ordersApi.selling().then((d) => setOrders(d.orders)),
      productsApi.mine().then((d) => setProducts(d.products)).catch(() => {}),
      subscriptionsApi.mine().then((d) => setSubscriptions(d.subscriptions)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-ink/40">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">Please log in</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">Log in</Link>
      </div>
    );
  }

  if (!user.sellerProfile) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">You don&apos;t have a shop yet</p>
        <p className="mt-2 text-sm text-ink/55">Open your Shoppan shop to start selling.</p>
        <Link href="/sell" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90">
          Open my shop
        </Link>
      </div>
    );
  }

  async function handleFulfill(orderId: string) {
    setFulfillingId(orderId);
    try {
      await ordersApi.fulfill(orderId);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "FULFILLED" } : o));
    } catch {
      // silent — production would show a toast
    } finally {
      setFulfillingId(null);
    }
  }

  const activeSub = subscriptions.find((s) => s.status === "ACTIVE" && s.plan.audience === "SELLER");
  const revenueTotal = orders.reduce((sum, o) => sum + o.sellerPayoutCents, 0);

  // Build last-7-calendar-days chart from real orders
  const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const dEnd = new Date(d);
    dEnd.setDate(d.getDate() + 1);
    return {
      day: SHORT_DAY[d.getDay()],
      sales: orders
        .filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= d.getTime() && t < dEnd.getTime();
        })
        .reduce((sum, o) => sum + o.sellerPayoutCents / 100, 0),
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">{user.sellerProfile.storeName}</h1>
          <p className="mt-1 text-sm text-ink/50">Seller dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          {activeSub && (
            <span className="rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
              {activeSub.plan.name} plan
            </span>
          )}
          <Link
            href="/dashboard/seller/profile"
            className="rounded-full border border-sand px-4 py-1.5 text-xs font-semibold text-ink hover:bg-sand"
          >
            Edit profile
          </Link>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl2 border border-sand bg-white p-5">
          <DollarSign size={18} className="text-ink/40" />
          <p className="mt-3 text-2xl font-semibold text-ink">{cents(revenueTotal)}</p>
          <p className="text-xs text-ink/50">Total revenue</p>
        </div>
        <div className="rounded-xl2 border border-sand bg-white p-5">
          <Package size={18} className="text-ink/40" />
          <p className="mt-3 text-2xl font-semibold text-ink">{products.length}</p>
          <p className="text-xs text-ink/50">Active listings</p>
        </div>
        <div className="rounded-xl2 border border-sand bg-white p-5">
          <TrendingUp size={18} className="text-ink/40" />
          <p className="mt-3 text-2xl font-semibold text-ink">{orders.length}</p>
          <p className="text-xs text-ink/50">Total orders</p>
        </div>
      </div>

      <div className="mb-8 rounded-xl2 border border-sand bg-white p-6">
        <p className="mb-4 text-sm font-semibold text-ink">Sales this week</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B4FE8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#5B4FE8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#8A8782" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #F1ECE4", fontSize: 12 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, "Sales"]}
              />
              <Area type="monotone" dataKey="sales" stroke="#5B4FE8" strokeWidth={2} fill="url(#sales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-ink">Your listings</h2>
        <Link
          href="/dashboard/seller/listings/new"
          className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-ink/90"
        >
          <Plus size={14} /> New listing
        </Link>
      </div>

      <div className="mt-4 divide-y divide-sand rounded-xl2 border border-sand bg-white">
        {products.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink/40">No listings yet.</p>
        )}
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-4 p-4">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
              <Image
                src={productImage(p, 120)}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">{p.title}</p>
              <p className="text-xs text-ink/45">{p.category.name}</p>
            </div>
            <span className="text-sm font-semibold text-ink">{cents(p.priceCents)}</span>
            <span className={`text-xs font-medium ${p.stock === 0 ? "text-red-500" : p.stock <= 3 ? "text-amber-600" : "text-ink/40"}`}>
              {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
            </span>
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/seller/listings/${p.id}/edit`}
                className="text-xs font-semibold text-ink/50 hover:text-ink"
              >
                Edit
              </Link>
              <Link
                href={`/products/${p.id}`}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Orders section */}
      <div className="mt-10">
        <h2 className="font-serif text-xl font-semibold text-ink">Recent orders</h2>
        <div className="mt-4 divide-y divide-sand rounded-xl2 border border-sand bg-white">
          {orders.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink/40">No orders yet.</p>
          )}
          {orders.map((o) => (
            <div key={o.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">
                    Order #{o.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-ink/45">
                    {new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {o.buyer && ` · ${o.buyer.name}`}
                  </p>
                </div>
                <span className="text-sm font-semibold text-ink">{cents(o.sellerPayoutCents)}</span>
              {o.status === "FULFILLED" ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle size={12} /> Fulfilled
                </span>
              ) : o.status === "PAID" ? (
                <button
                  onClick={() => handleFulfill(o.id)}
                  disabled={fulfillingId === o.id}
                  className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
                >
                  <Clock size={12} />
                  {fulfillingId === o.id ? "Marking…" : "Mark fulfilled"}
                </button>
              ) : (
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-ink/50">
                  {o.status}
                </span>
              )}
              </div>
              {o.items.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {o.items.slice(0, 5).map((item) => (
                    item.product && (
                      <div key={item.id} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-sand" title={item.product.title}>
                        <Image src={productImage(item.product, 80)} alt="" fill className="object-cover" unoptimized />
                      </div>
                    )
                  ))}
                  {o.items.length > 5 && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-sand text-xs font-medium text-ink/50">
                      +{o.items.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
