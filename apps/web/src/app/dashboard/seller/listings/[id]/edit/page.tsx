"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { productsApi, categoriesApi, ApiError, type Product, type Category } from "@/lib/api-client";

export default function EditListingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      productsApi.getOne(id).then((d) => {
        const p = d.product;
        setProduct(p);
        setTitle(p.title);
        setDescription(p.description);
        setCategorySlug(p.category.slug);
        setPriceStr((p.priceCents / 100).toFixed(2));
        setStock(String(p.stock));
        setImageUrl(p.imageUrl ?? "");
        setIsActive(p.isActive);
      }),
      categoriesApi.list().then((d) => setCategories(d.categories)),
    ]).finally(() => setDataLoading(false));
  }, [id, user]);

  if (authLoading || dataLoading) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const priceCents = Math.round(parseFloat(priceStr) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      setError("Enter a valid price.");
      return;
    }
    setLoading(true);
    try {
      await productsApi.update(id, {
        title: title.trim(),
        description: description.trim(),
        categorySlug,
        priceCents,
        stock: parseInt(stock, 10),
        imageUrl: imageUrl.trim() || undefined,
        isActive,
      });
      router.push("/dashboard/seller");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product?.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await productsApi.delete(id);
      router.push("/dashboard/seller");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete listing.");
      setDeleting(false);
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

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Edit listing</h1>
          <p className="mt-1 text-sm text-ink/50 truncate max-w-sm">{product?.title}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={13} /> {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="rounded-xl2 border border-sand bg-white p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Product details</h2>
            <label className="flex items-center gap-2 text-xs text-ink/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded"
              />
              Active (visible to buyers)
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink/40">$</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
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
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-ink px-7 py-3 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save changes"}
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
