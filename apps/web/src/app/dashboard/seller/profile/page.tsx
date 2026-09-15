"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { usersApi, ApiError, sellerAvatar, sellerBanner } from "@/lib/api-client";

export default function SellerProfilePage() {
  const { user, isLoading, refresh } = useAuth();

  const [storeName, setStoreName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Populate form when user loads
  useEffect(() => {
    if (!user?.sellerProfile) return;
    setStoreName(user.sellerProfile.storeName);
    setBio(user.sellerProfile.bio ?? "");
    setAvatarUrl(user.sellerProfile.avatarUrl ?? "");
    setBannerUrl(user.sellerProfile.bannerUrl ?? "");
  }, [user]);

  if (isLoading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">Please log in</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white">
          Log in
        </Link>
      </div>
    );
  }

  if (!user.sellerProfile) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-serif text-2xl text-ink">You don&apos;t have a shop yet</p>
        <Link href="/sell" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90">
          Open my shop
        </Link>
      </div>
    );
  }

  // Build a preview profile merging live state with saved data
  const previewProfile = {
    ...user.sellerProfile,
    storeName: storeName || user.sellerProfile.storeName,
    bio: bio || null,
    avatarUrl: avatarUrl || null,
    bannerUrl: bannerUrl || null,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      await usersApi.updateSellerProfile({
        storeName: storeName.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        bannerUrl: bannerUrl.trim(),
      });
      await refresh();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">Shop profile</h1>
          <p className="mt-1 text-sm text-ink/50">Changes appear on your public storefront.</p>
        </div>
        <Link
          href={`/sellers/${user.sellerProfile.slug}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
          target="_blank"
        >
          View public page →
        </Link>
      </div>

      {/* Preview */}
      <div className="mb-8 overflow-hidden rounded-xl2 border border-sand bg-white">
        <div className="relative h-28 w-full">
          <Image
            src={sellerBanner(previewProfile)}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex items-end gap-4 px-5 -mt-8 pb-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-white bg-sand">
            <Image
              src={sellerAvatar(previewProfile)}
              alt={previewProfile.storeName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="pb-1">
            <p className="font-serif text-lg font-semibold text-ink">{previewProfile.storeName || "Your shop name"}</p>
            {previewProfile.bio && (
              <p className="text-xs text-ink/55">{previewProfile.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl2 border border-sand bg-white p-6 space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Profile updated successfully.
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">
            Shop name <span className="text-red-400">*</span>
          </label>
          <input
            required
            minLength={2}
            maxLength={60}
            value={storeName}
            onChange={(e) => { setStoreName(e.target.value); setSuccess(false); }}
            className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">
            Shop bio <span className="text-ink/30">(optional)</span>
          </label>
          <textarea
            rows={3}
            maxLength={500}
            value={bio}
            onChange={(e) => { setBio(e.target.value); setSuccess(false); }}
            placeholder="Tell buyers about your craft, materials, or story…"
            className="w-full resize-none rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
          />
          <p className="mt-1 text-xs text-ink/40">{bio.length}/500</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">
            Avatar URL <span className="text-ink/30">(optional)</span>
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => { setAvatarUrl(e.target.value); setSuccess(false); }}
            placeholder="https://…"
            className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
          />
          <p className="mt-1 text-xs text-ink/40">Leave blank to use your initials avatar.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">
            Banner URL <span className="text-ink/30">(optional)</span>
          </label>
          <input
            type="url"
            value={bannerUrl}
            onChange={(e) => { setBannerUrl(e.target.value); setSuccess(false); }}
            placeholder="https://…"
            className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
          />
          <p className="mt-1 text-xs text-ink/40">Recommended: 1600×400px. Leave blank to use a generated banner.</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-sand">
          <Link href="/dashboard/seller" className="text-sm text-ink/50 hover:text-ink">
            ← Back to dashboard
          </Link>
          <button
            type="submit"
            disabled={saving || !storeName.trim()}
            className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
