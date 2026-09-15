import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Truck, ShieldCheck, Sparkles } from "lucide-react";
import { sellerAvatar, sellerBanner, type Product, type SellerProfile } from "@/lib/api-client";
import RecommendedProducts from "@/components/RecommendedProducts";
import ProductCard from "@/components/ProductCard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchFeatured(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/products?pageSize=8`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products ?? [];
  } catch {
    return [];
  }
}

async function fetchSellers(): Promise<SellerProfile[]> {
  try {
    const res = await fetch(`${API}/sellers`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.sellers ?? []).slice(0, 4);
  } catch {
    return [];
  }
}


export default async function HomePage() {
  const [featured, sellers] = await Promise.all([fetchFeatured(), fetchSellers()]);

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              <Sparkles size={13} /> Now with Shoppan+ membership
            </span>
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight text-ink sm:text-5xl">
              Handmade goods, made by people you can actually find.
            </h1>
            <p className="mt-4 max-w-md text-base text-ink/60">
              Shoppan is a marketplace for independent makers. Shop directly from small studios,
              or subscribe for member pricing, early access, and free shipping on every order.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              >
                Shop the marketplace <ArrowRight size={16} />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-sand px-6 py-3 text-sm font-semibold text-ink transition hover:bg-sand"
              >
                See membership plans
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-ink/50">
              <span className="flex items-center gap-1.5"><Truck size={15} /> Free shipping w/ Shoppan+</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={15} /> Buyer protection on every order</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-xl2">
              <Image src="https://picsum.photos/seed/hero-main/900/560" alt="Featured maker studio" fill className="object-cover" priority />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl2">
              <Image src="https://picsum.photos/seed/hero-a/400/400" alt="Handmade ceramics" fill className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl2">
              <Image src="https://picsum.photos/seed/hero-b/400/400" alt="Leather goods" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-ink">Popular this week</h2>
              <p className="mt-1 text-sm text-ink/50">Picked from our top-rated small shops</p>
            </div>
            <Link
              href="/products"
              className="hidden text-sm font-semibold text-primary-600 hover:text-primary-700 sm:block"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Personalized recommendations — client island, only shows for logged-in users with history */}
      <RecommendedProducts />

      {/* Membership banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 rounded-xl2 bg-ink px-8 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-serif text-2xl font-semibold text-white">Shop small often? Join Shoppan+.</p>
            <p className="mt-1.5 text-sm text-white/60">
              Free shipping, early access to new drops, and 10% off — for $6/mo.
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white/90"
          >
            Explore membership
          </Link>
        </div>
      </section>

      {/* Sellers */}
      {sellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-serif text-2xl font-semibold text-ink">Shops to know</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sellers.map((s) => (
              <Link
                key={s.id}
                href={`/sellers/${s.slug}`}
                className="group overflow-hidden rounded-xl2 border border-sand bg-white transition hover:shadow-card"
              >
                <div className="relative h-24 w-full overflow-hidden">
                  <Image src={sellerBanner(s)} alt="" fill className="object-cover" unoptimized />
                </div>
                <div className="p-4">
                  <div className="relative -mt-10 mb-2 h-14 w-14 overflow-hidden rounded-full border-2 border-white">
                    <Image src={sellerAvatar(s)} alt={s.storeName} fill className="object-cover" unoptimized />
                  </div>
                  <p className="text-sm font-semibold text-ink">{s.storeName}</p>
                  {s.bio && <p className="mt-0.5 line-clamp-1 text-xs text-ink/50">{s.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
