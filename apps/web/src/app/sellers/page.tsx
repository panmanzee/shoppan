import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { sellerAvatar, sellerBanner, type SellerProfile } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Shops · Shoppan",
  description: "Browse independent makers and handmade goods shops on Shoppan.",
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchSellers(): Promise<SellerProfile[]> {
  try {
    const res = await fetch(`${API}/sellers`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.sellers ?? [];
  } catch {
    return [];
  }
}

export default async function SellersPage() {
  const sellers = await fetchSellers();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-ink">Shops</h1>
        <p className="mt-2 text-sm text-ink/55">
          {sellers.length} independent {sellers.length === 1 ? "maker" : "makers"} on Shoppan
        </p>
      </div>

      {sellers.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-sm text-ink/40">No shops yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sellers.map((s) => (
            <Link
              key={s.id}
              href={`/sellers/${s.slug}`}
              className="group overflow-hidden rounded-xl2 border border-sand bg-white transition hover:shadow-card"
            >
              <div className="relative h-28 w-full overflow-hidden">
                <Image
                  src={sellerBanner(s)}
                  alt=""
                  fill
                  className="object-cover transition group-hover:scale-105"
                  unoptimized
                />
              </div>
              <div className="px-5 pb-5 pt-0">
                <div className="relative -mt-8 mb-3 h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-sand shadow-sm">
                  <Image
                    src={sellerAvatar(s)}
                    alt={s.storeName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-ink">{s.storeName}</p>
                  {s.verified && <BadgeCheck size={15} className="shrink-0 text-primary-500" />}
                </div>
                {s.bio && (
                  <p className="mt-1 line-clamp-2 text-xs text-ink/55">{s.bio}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-xl2 bg-ink px-8 py-8 text-center sm:flex-row sm:text-left">
        <div>
          <p className="font-serif text-xl font-semibold text-white">Open your own shop</p>
          <p className="mt-1 text-sm text-white/60">Free to open. No listing fees to start.</p>
        </div>
        <Link
          href="/sell"
          className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-white/90"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
