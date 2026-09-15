"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, CreditCard } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { checkoutApi, subscriptionsApi, ApiError } from "@/lib/api-client";

export default function CheckoutPage() {
  const { lines, subtotalCents, itemCount, clearCart } = useCart();
  const { user } = useAuth();
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isMember, setIsMember] = useState(false);

  // Check if the logged-in buyer has an active paid subscription
  useEffect(() => {
    if (!user) return;
    subscriptionsApi
      .mine()
      .then(({ subscriptions }) => {
        setIsMember(
          subscriptions.some(
            (s) =>
              s.status === "ACTIVE" &&
              s.plan.audience === "BUYER" &&
              s.plan.priceCents > 0
          )
        );
      })
      .catch(() => {});
  }, [user]);

  const subtotalDollars = subtotalCents / 100;
  const shippingDollars = isMember ? 0 : 6.5;
  const discountDollars = isMember ? subtotalDollars * 0.1 : 0;
  const totalDollars = subtotalDollars - discountDollars + shippingDollars;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Please log in to complete your purchase.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const items = lines.map((l) => ({ productId: l.product.id, quantity: l.quantity }));
      await checkoutApi.checkout(items);
      clearCart();
      setPlaced(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout failed — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (placed) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-2xl">
          ✓
        </div>
        <p className="mt-5 font-serif text-2xl font-semibold text-ink">Order placed</p>
        <p className="mt-2 text-sm text-ink/55">
          Your order has been confirmed. Check your dashboard for order details.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/dashboard/buyer"
            className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90"
          >
            View orders
          </Link>
          <Link
            href="/products"
            className="rounded-full border border-sand px-6 py-3 text-sm font-semibold text-ink hover:bg-sand"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-ink">Checkout</h1>

      {!user && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Link href="/login" className="font-semibold underline">Log in</Link> to save your order history and apply membership discounts.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          <section className="rounded-xl2 border border-sand bg-white p-6">
            <p className="mb-4 text-sm font-semibold text-ink">Shipping address</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input required placeholder="Full name" className="rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
              <input required placeholder="Phone number" className="rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
              <input required placeholder="Address" className="sm:col-span-2 rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
              <input required placeholder="City" className="rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
              <input required placeholder="Postal code" className="rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
          </section>

          <section className="rounded-xl2 border border-sand bg-white p-6">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
              <CreditCard size={16} /> Payment
            </p>
            <div className="grid grid-cols-1 gap-3">
              <input required placeholder="Card number" className="rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="MM / YY" className="rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
                <input required placeholder="CVC" className="rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300" />
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/40">
              <Lock size={12} /> Payments processed by Stripe in production.
            </p>
          </section>
        </div>

        <div className="h-fit rounded-xl2 border border-sand bg-white p-6">
          <p className="font-serif text-lg font-semibold text-ink">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </p>
          <div className="mt-4 space-y-2.5 text-sm text-ink/65">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-ink">${subtotalDollars.toFixed(2)}</span>
            </div>
            {discountDollars > 0 && (
              <div className="flex justify-between text-primary-600">
                <span>Shoppan+ savings (10%)</span>
                <span>−${discountDollars.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-ink">
                {isMember ? <span className="text-primary-600">Free</span> : "$6.50"}
              </span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-sand pt-4 text-sm font-semibold text-ink">
            <span>Total</span>
            <span>${totalDollars.toFixed(2)}</span>
          </div>
          {!isMember && user && (
            <p className="mt-2 text-xs text-ink/40">
              <Link href="/pricing" className="underline">Join Shoppan+</Link> to unlock 10% off and free shipping.
            </p>
          )}
          <button
            type="submit"
            disabled={loading || lines.length === 0}
            className="mt-6 w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
          >
            {loading ? "Placing order…" : "Place order"}
          </button>
        </div>
      </form>
    </div>
  );
}
