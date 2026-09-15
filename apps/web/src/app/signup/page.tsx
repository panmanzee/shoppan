"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Store } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api-client";

export default function SignupPage() {
  const { signup } = useAuth();
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup({ name, email, password, role });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <p className="font-serif text-2xl font-semibold text-ink">Create your account</p>
      <p className="mt-1.5 text-sm text-ink/55">Join Shoppan as a shopper or open your own shop</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setRole("BUYER")}
          className={`flex flex-col items-center gap-2 rounded-xl2 border p-5 text-center transition ${
            role === "BUYER" ? "border-ink bg-white shadow-card" : "border-sand text-ink/50"
          }`}
        >
          <ShoppingBag size={22} />
          <span className="text-sm font-semibold">I want to shop</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("SELLER")}
          className={`flex flex-col items-center gap-2 rounded-xl2 border p-5 text-center transition ${
            role === "SELLER" ? "border-ink bg-white shadow-card" : "border-sand text-ink/50"
          }`}
        >
          <Store size={22} />
          <span className="text-sm font-semibold">I want to sell</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/60">
            {role === "SELLER" ? "Your name" : "Full name"}
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "SELLER" ? "e.g. Jane Doe" : "Jane Doe"}
            className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
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
          <label className="mb-1.5 block text-xs font-medium text-ink/60">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            className="w-full rounded-lg border border-sand px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
        >
          {loading ? "Creating account…" : role === "SELLER" ? "Create my account" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink/40">
        By continuing you agree to Shoppan&apos;s Terms and Privacy Policy.
      </p>
      <p className="mt-3 text-center text-sm text-ink/55">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Log in
        </Link>
      </p>
    </div>
  );
}
