import type { Metadata } from "next";
import Link from "next/link";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Shop all handmade goods · Shoppan",
  description: "Browse thousands of handmade products from independent makers — ceramics, jewelry, candles, leather goods, and more.",
};
import { type Product } from "@/lib/api-client";
import ProductCard from "@/components/ProductCard";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const PAGE_SIZE = 20;

const CATEGORIES = ["Ceramics", "Jewelry", "Candles & Home", "Leather Goods", "Art Prints", "Textiles"];

async function fetchProducts(
  category?: string,
  page = 1,
): Promise<{ products: Product[]; total: number }> {
  const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (category) qs.set("category", category.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
  const res = await fetch(`${API}/products?${qs}`, { cache: "no-store" });
  if (!res.ok) return { products: [], total: 0 };
  const data = await res.json();
  return { products: data.products ?? [], total: data.pagination?.total ?? 0 };
}

async function fetchCategories(): Promise<{ name: string; slug: string }[]> {
  const res = await fetch(`${API}/categories`, { cache: "no-store" });
  if (!res.ok) return CATEGORIES.map((name) => ({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") }));
  const data = await res.json();
  return data.categories ?? [];
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const [{ products, total }, categories] = await Promise.all([
    fetchProducts(searchParams.category, page),
    fetchCategories(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const activeCategory = searchParams.category;

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-ink">Shop all</h1>
        <p className="mt-1 text-sm text-ink/50">
          {total} handmade goods from independent shops
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
              <SlidersHorizontal size={15} /> Category
            </p>
            <div className="flex flex-col gap-1">
              <Link
                href="/products"
                className={`rounded-md px-2.5 py-1.5 text-sm ${
                  !activeCategory ? "bg-ink text-white" : "text-ink/70 hover:bg-sand"
                }`}
              >
                All categories
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/products?category=${encodeURIComponent(c.name)}`}
                  className={`rounded-md px-2.5 py-1.5 text-sm ${
                    activeCategory === c.name ? "bg-ink text-white" : "text-ink/70 hover:bg-sand"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl2 border border-sand bg-white p-4">
            <p className="text-sm font-semibold text-ink">Shoppan+ members</p>
            <p className="mt-1 text-xs text-ink/50">
              save 10% storewide and get free shipping automatically at checkout.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-block text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              Learn more →
            </Link>
          </div>
        </aside>

        <div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {products.length === 0 && (
              <p className="col-span-3 py-12 text-center text-sm text-ink/40">
                No products yet — check back soon.
              </p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="flex items-center gap-1 rounded-full border border-sand px-4 py-2 text-sm font-medium text-ink/70 hover:bg-sand"
                >
                  <ChevronLeft size={16} /> Prev
                </Link>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-sand px-4 py-2 text-sm font-medium text-ink/30 cursor-not-allowed">
                  <ChevronLeft size={16} /> Prev
                </span>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-sm text-ink/30">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={pageHref(p as number)}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium ${
                          p === page
                            ? "bg-ink text-white"
                            : "border border-sand text-ink/70 hover:bg-sand"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )}
              </div>

              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="flex items-center gap-1 rounded-full border border-sand px-4 py-2 text-sm font-medium text-ink/70 hover:bg-sand"
                >
                  Next <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-sand px-4 py-2 text-sm font-medium text-ink/30 cursor-not-allowed">
                  Next <ChevronRight size={16} />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
