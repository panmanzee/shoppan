"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { recommendationsApi, productImage, cents, type Product } from "@/lib/api-client";
import { useCart } from "@/lib/cart-context";

/**
 * Client-side island that fetches personalized recommendations for logged-in
 * users. Renders nothing if the user is logged out or has no history yet.
 * Placed inside a server-rendered page without breaking static generation.
 */
export default function RecommendedProducts() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    recommendationsApi
      .forMe()
      .then(({ products }) => setProducts(products.slice(0, 6)))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary-500" />
            <h2 className="font-serif text-2xl font-semibold text-ink">Picked for you</h2>
          </div>
          <p className="mt-1 text-sm text-ink/50">Based on what you&apos;ve been browsing</p>
        </div>
        <Link
          href="/products"
          className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 sm:block"
        >
          Browse all →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
        {products.map((p) => (
            <div key={p.id} className="group">
              <Link href={`/products/${p.id}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-xl2 bg-sand">
                  <Image
                    src={productImage(p)}
                    alt={p.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    unoptimized
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(p);
                    }}
                    className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-card opacity-0 transition group-hover:opacity-100 hover:bg-ink hover:text-white text-xs font-bold"
                    aria-label="Add to cart"
                  >
                    +
                  </button>
                </div>
              </Link>
              <div className="mt-2">
                <Link href={`/products/${p.id}`}>
                  <p className="line-clamp-1 text-xs font-medium text-ink">{p.title}</p>
                </Link>
                <p className="mt-0.5 text-xs font-semibold text-ink">{cents(p.priceCents)}</p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
