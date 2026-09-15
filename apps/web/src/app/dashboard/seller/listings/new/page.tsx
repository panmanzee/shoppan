"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { productsApi, categoriesApi, ApiError, type Category } from "@/lib/api-client";

export default function NewListingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [stock, setStock] = useState("10");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    categoriesApi.list().then((d) => {
      setCategories(d.categories);
      if (d.categories.length > 0) setCategorySlug(d.categories[0].slug);
    });
  }, []);

  if (authLoading) return null;

  if (!user || (user.role !== "SELLER" && user.role !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">Sellers only</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
          Log in
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const priceCents = Math.round(parseFloat(priceStr) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Enter a valid price greater than $0.");
      return;
    }

    setLoading(true);
    try {
      await productsApi.create({
        title: title.trim(),
        description: description.trim(),
        categorySlug,
        priceCents,
        stock: parseInt(stock, 10),
        imageUrl: imageUrl.trim() || undefined,
      });
      router.push("/dashboard/seller");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create listing.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/seller"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to dashboard
      </Link>

      <h1 className="font-serif text-3xl font-semibold text-ink">New listing</h1>
      <p className="mt-1 text-sm text-ink/50">Fill in the details below — you can edit them later.</p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="rounded-xl2 border border-sand bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink">Product details</h2>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hand-Thrown Stoneware Mug"
              className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Description</label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the material, dimensions, care instructions…"
              className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Category</label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300 bg-white"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl2 border border-sand bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink">Pricing & inventory</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Price (USD)</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/40">
                  $
                </span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-sand py-2.5 pl-7 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink/60">Stock quantity</label>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl2 border border-sand bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold text-ink">Photo</h2>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">
              Image URL <span className="text-ink/30">(optional — leave blank for placeholder)</span>
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
            />
            <p className="mt-1.5 text-xs text-ink/40">
              S3 presigned upload coming in a future release. For now, paste any public image URL.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-ink px-7 py-3 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
          >
            {loading ? "Publishing…" : "Publish listing"}
          </button>
          <Link
            href="/dashboard/seller"
            className="rounded-full border border-sand px-7 py-3 text-sm font-semibold text-ink hover:bg-sand"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
