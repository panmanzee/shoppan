import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { cents } from "@/lib/api-client";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  imageUrl: string | null;
  seller: { storeName: string; slug: string };
  category: { name: string; slug: string };
  score: number;
}

async function fetchResults(q: string): Promise<SearchResult[]> {
  if (!q) return [];
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}&limit=24`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  const q = searchParams.q?.trim();
  return {
    title: q ? `"${q}" · Search Shoppan` : "Search handmade goods · Shoppan",
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? "";
  const results = await fetchResults(q);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Search bar */}
      <form method="GET" action="/search" className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xl">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"
          />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search handmade goods…"
            autoFocus
            className="w-full rounded-full border border-sand bg-white py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink/90"
        >
          Search
        </button>
      </form>

      {/* Results heading */}
      <div className="mt-8">
        {q ? (
          <h1 className="font-serif text-2xl font-semibold text-ink">
            {results.length > 0
              ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"`
              : `No results for "${q}"`}
          </h1>
        ) : (
          <h1 className="font-serif text-2xl font-semibold text-ink">Search Shoppan</h1>
        )}

        {!q && (
          <p className="mt-2 text-sm text-ink/50">
            Try searching for ceramics, leather, candles, prints…
          </p>
        )}
        {q && results.length === 0 && (
          <p className="mt-2 text-sm text-ink/50">
            Try different keywords, or{" "}
            <Link href="/products" className="font-medium text-primary-600 hover:text-primary-700">
              browse all products
            </Link>
            .
          </p>
        )}
      </div>

      {/* Grid */}
      {results.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {results.map((r) => {
            const img = r.imageUrl ?? `https://picsum.photos/seed/${r.id}/400/400`;
            return (
              <Link key={r.id} href={`/products/${r.id}`} className="group">
                <div className="relative aspect-square overflow-hidden rounded-xl2 bg-sand">
                  <Image
                    src={img}
                    alt={r.title}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    unoptimized
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs text-ink/50">{r.seller.storeName}</p>
                  <p className="mt-0.5 text-sm font-medium leading-snug text-ink line-clamp-2">
                    {r.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{cents(r.priceCents)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
