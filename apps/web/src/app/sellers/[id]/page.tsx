import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, Calendar } from "lucide-react";
import { sellerAvatar, sellerBanner, type Product, type SellerProfile } from "@/lib/api-client";
import ProductCard from "@/components/ProductCard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const seller = await fetchSeller(params.id);
  if (!seller) return { title: "Shop not found · Shoppan" };
  return {
    title: `${seller.storeName} · Shoppan`,
    description: seller.bio ?? `Shop handmade goods from ${seller.storeName} on Shoppan.`,
  };
}

async function fetchSeller(slug: string): Promise<(SellerProfile & { products: Product[] }) | null> {
  const res = await fetch(`${API}/sellers/${slug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  return data.seller ?? null;
}

export default async function SellerPage({ params }: { params: { id: string } }) {
  const seller = await fetchSeller(params.id);
  if (!seller) return notFound();

  const joinedYear = new Date(seller.createdAt).getFullYear();

  return (
    <div>
      <div className="relative h-48 w-full sm:h-64">
        <Image
          src={sellerBanner(seller)}
          alt=""
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-cream bg-white">
            <Image
              src={sellerAvatar(seller)}
              alt={seller.storeName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="pb-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-semibold text-ink">{seller.storeName}</h1>
              {seller.verified && <BadgeCheck size={19} className="text-primary-500" />}
            </div>
            {seller.bio && (
              <p className="mt-1 text-sm text-ink/60">{seller.bio}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-b border-sand pb-6 text-sm text-ink/60">
          <span className="flex items-center gap-1.5">
            <Calendar size={15} /> On Shoppan since {joinedYear}
          </span>
          <span>{seller.products.length} items</span>
        </div>

        <div className="py-10">
          <h2 className="mb-6 font-serif text-xl font-semibold text-ink">
            Shop items ({seller.products.length})
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {seller.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
