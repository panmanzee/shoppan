"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { productImage, cents } from "@/lib/api-client";

export default function CartPage() {
  const { lines, setQuantity, removeFromCart, subtotalCents } = useCart();

  const bySeller = lines.reduce<Record<string, typeof lines>>((acc, line) => {
    const sid = line.product.seller.id;
    acc[sid] = acc[sid] ? [...acc[sid], line] : [line];
    return acc;
  }, {});

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <ShoppingBag size={40} className="text-ink/20" />
        <p className="mt-4 font-serif text-2xl font-semibold text-ink">Your cart is empty</p>
        <p className="mt-1.5 text-sm text-ink/50">Find something handmade to fill it with.</p>
        <Link href="/products" className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90">
          Browse the shop
        </Link>
      </div>
    );
  }

  const shippingCents = 650;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-ink">Your cart</h1>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {Object.values(bySeller).map((sellerLines) => {
            const seller = sellerLines[0].product.seller;
            return (
              <div key={seller.id} className="rounded-xl2 border border-sand bg-white p-5">
                <p className="mb-4 text-sm font-semibold text-ink">
                  Sold by {seller.storeName}
                  <span className="ml-2 text-xs font-normal text-ink/40">ships separately</span>
                </p>
                <div className="divide-y divide-sand">
                  {sellerLines.map((line) => (
                    <div key={line.product.id} className="flex gap-4 py-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                        <Image
                          src={productImage(line.product, 160)}
                          alt={line.product.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-ink">{line.product.title}</p>
                          <button
                            onClick={() => removeFromCart(line.product.id)}
                            className="text-ink/30 hover:text-ink"
                            aria-label="Remove item"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {cents(line.product.priceCents)}
                        </p>
                        <div className="mt-auto flex w-fit items-center rounded-full border border-sand">
                          <button
                            onClick={() => setQuantity(line.product.id, line.quantity - 1)}
                            className="p-2 text-ink/60 hover:text-ink"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-5 text-center text-xs font-medium">{line.quantity}</span>
                          <button
                            onClick={() => setQuantity(line.product.id, Math.min(line.product.stock, line.quantity + 1))}
                            disabled={line.quantity >= line.product.stock}
                            className="p-2 text-ink/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-fit rounded-xl2 border border-sand bg-white p-6">
          <p className="font-serif text-lg font-semibold text-ink">Order summary</p>
          <div className="mt-4 space-y-2.5 text-sm text-ink/65">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-ink">{cents(subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-medium text-ink">{cents(shippingCents)}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-sand pt-4 text-sm font-semibold text-ink">
            <span>Estimated total</span>
            <span>{cents(subtotalCents + shippingCents)}</span>
          </div>
          <p className="mt-2 text-xs text-ink/40">
            <Link href="/pricing" className="underline">Shoppan+ members</Link> save 10% + get free shipping at checkout.
          </p>
          <Link
            href="/checkout"
            className="mt-4 block rounded-full bg-ink px-4 py-3 text-center text-sm font-semibold text-white hover:bg-ink/90"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
