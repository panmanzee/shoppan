"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, Truck, ShieldCheck, Minus, Plus } from "lucide-react";
import {
  productsApi,
  reviewsApi,
  recommendationsApi,
  productImage,
  sellerAvatar,
  cents,
  type Product,
  type Review,
} from "@/lib/api-client";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import ProductCard from "@/components/ProductCard";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(true);
  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewDone, setReviewDone] = useState(false);

  useEffect(() => {
    Promise.all([
      productsApi.getOne(params.id),
      reviewsApi.forProduct(params.id).catch(() => ({ reviews: [] })),
      recommendationsApi.similar(params.id).catch(() => ({ products: [] })),
    ]).then(([pd, rd, sd]) => {
      setProduct(pd.product);
      setReviews(rd.reviews);
      setSimilar(sd.products.slice(0, 4));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params.id]);

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReviewError("");
    setReviewSubmitting(true);
    try {
      const { review } = await reviewsApi.createForProduct(params.id, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviews((prev) => [review, ...prev]);
      setReviewDone(true);
      setReviewComment("");
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Could not submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-ink/40">Loading…</div>;
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">Product not found</p>
        <Link href="/products" className="mt-4 inline-block text-sm text-primary-600">Back to shop</Link>
      </div>
    );
  }

  const memberPrice = cents(Math.round(product.priceCents * 0.9));

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) addToCart(product!);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-1.5 text-xs text-ink/45">
        <Link href="/products" className="hover:text-ink">Shop</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink">
          {product.category.name}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="grid grid-cols-4 gap-3">
          <div className="relative col-span-4 aspect-square overflow-hidden rounded-xl2 bg-sand">
            <Image
              src={productImage(product, 900)}
              alt={product.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="relative aspect-square overflow-hidden rounded-lg bg-sand">
              <Image
                src={`https://picsum.photos/seed/${product.id}-${n}/300/300`}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">{product.title}</h1>
          <Link
            href={`/sellers/${product.seller.slug}`}
            className="mt-2 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
          >
            <div className="relative h-5 w-5 overflow-hidden rounded-full">
              <Image src={sellerAvatar(product.seller)} alt="" fill className="object-cover" unoptimized />
            </div>
            by <span className="font-medium">{product.seller.storeName}</span>
          </Link>

          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink">{cents(product.priceCents)}</span>
          </div>
          {user && (
            <p className="mt-1 text-xs text-primary-600">
              Shoppan+ members pay {memberPrice} — 10% off
            </p>
          )}

          <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/65">
            {product.description}
          </p>

          <div className="mt-7 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-sand">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-2.5 text-ink/60 hover:text-ink"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-6 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product!.stock, q + 1))}
                className="p-2.5 text-ink/60 hover:text-ink"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex-1 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:opacity-50"
            >
              {product.stock === 0 ? "Out of stock" : added ? "Added to cart ✓" : "Add to cart"}
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 border-t border-sand pt-6 text-sm text-ink/60">
            <span className="flex items-center gap-2">
              <Truck size={16} /> Free shipping with Shoppan+, or $6.50 standard
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} /> Covered by Shoppan buyer protection
            </span>
          </div>
        </div>
      </div>
      {/* Reviews */}
      <section className="mt-16 border-t border-sand pt-10">
        <h2 className="font-serif text-2xl font-semibold text-ink">
          Reviews {reviews.length > 0 && <span className="text-ink/40 text-lg">({reviews.length})</span>}
        </h2>

        {reviews.length > 0 && (
          <div className="mt-6 space-y-5">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl2 border border-sand bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-ink">{r.author.name}</span>
                  <span className="text-xs text-ink/40">
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="mt-1 flex gap-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} size={14} className={s <= r.rating ? "fill-amber-400 text-amber-400" : "text-ink/20"} />
                  ))}
                </div>
                {r.comment && <p className="mt-2 text-sm text-ink/70">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {reviews.length === 0 && (
          <p className="mt-4 text-sm text-ink/40">No reviews yet — be the first.</p>
        )}

        {/* Review form — only for logged-in buyers */}
        {user && !reviewDone && (
          <form onSubmit={handleReviewSubmit} className="mt-8 rounded-xl2 border border-sand bg-white p-6">
            <p className="mb-4 text-sm font-semibold text-ink">Write a review</p>

            <div className="mb-4">
              <p className="mb-2 text-xs text-ink/60">Rating</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewRating(s)}
                    className="p-0.5"
                  >
                    <Star size={22} className={s <= reviewRating ? "fill-amber-400 text-amber-400" : "text-ink/20 hover:text-amber-300"} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Share your experience… (optional)"
              className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />

            {reviewError && (
              <p className="mt-2 text-xs text-red-600">{reviewError}</p>
            )}

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="mt-3 rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
            >
              {reviewSubmitting ? "Submitting…" : "Submit review"}
            </button>
          </form>
        )}

        {reviewDone && (
          <p className="mt-4 text-sm font-medium text-emerald-600">Review submitted — thank you!</p>
        )}

        {!user && (
          <p className="mt-4 text-sm text-ink/40">
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">Log in</Link> to leave a review.
          </p>
        )}
      </section>

      {similar.length > 0 && (
        <section className="mt-16 border-t border-sand pt-10">
          <h2 className="mb-6 font-serif text-2xl font-semibold text-ink">You might also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
