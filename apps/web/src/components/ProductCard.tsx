"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { type Product, productImage, cents } from "@/lib/api-client";
import { useCart } from "@/lib/cart-context";

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <div className="group">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl2 bg-sand">
          <Image
            src={productImage(product)}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            unoptimized
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart(product);
            }}
            className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink shadow-card opacity-0 transition group-hover:opacity-100 hover:bg-ink hover:text-white"
            aria-label="Add to cart"
          >
            <Plus size={17} />
          </button>
        </div>
      </Link>
      <div className="mt-3">
        <Link href={`/products/${product.id}`}>
          <p className="line-clamp-2 text-sm font-medium text-ink">{product.title}</p>
        </Link>
        <Link
          href={`/sellers/${product.seller.slug}`}
          className="mt-0.5 block text-xs text-ink/50 hover:text-ink/80"
        >
          {product.seller.storeName}
        </Link>
        <p className="mt-1.5 text-sm font-semibold text-ink">{cents(product.priceCents)}</p>
      </div>
    </div>
  );
}
