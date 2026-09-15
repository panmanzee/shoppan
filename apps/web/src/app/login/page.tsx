"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-140px)] max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="mx-auto w-full max-w-sm">
        <p className="font-serif text-2xl font-semibold text-ink">Welcome back</p>
        <p className="mt-1.5 text-sm text-ink/55">Log in to your Shoppan account</p>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/60">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-ink/60">Password</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink/55">
          New to Shoppan?{" "}
          <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-700">
            Create an account
          </Link>
        </p>
      </div>

      <div className="relative hidden aspect-[4/5] overflow-hidden rounded-xl2 lg:block">
        <Image src="https://picsum.photos/seed/login-hero/700/900" alt="" fill className="object-cover" />
      </div>
    </div>
  );
}
