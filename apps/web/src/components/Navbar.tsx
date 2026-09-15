"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

const staticNavLinks = [
  { href: "/products", label: "Shop" },
  { href: "/sellers", label: "Makers" },
  { href: "/pricing", label: "Membership" },
];

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const dashboardHref =
    user?.role === "SELLER" || user?.role === "ADMIN" ? "/dashboard/seller" : "/dashboard/buyer";

  const sellHref =
    user?.role === "SELLER" || user?.role === "ADMIN" ? "/dashboard/seller" : "/sell";

  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          className="mr-1 rounded-md p-1.5 text-ink md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight text-ink">
          Shoppan
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {staticNavLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink/70 transition hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={sellHref}
            className="text-sm font-medium text-ink/70 transition hover:text-ink"
          >
            Sell on Shoppan
          </Link>
        </nav>

        <form
          method="GET"
          action="/search"
          className="ml-auto hidden flex-1 items-center sm:flex max-w-md"
        >
          <div className="relative w-full">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
            />
            <input
              type="text"
              name="q"
              placeholder="Search handmade goods…"
              className="w-full rounded-full border border-sand bg-white py-2 pl-9 pr-4 text-sm outline-none ring-primary-300 transition focus:ring-2"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:ml-4">
          {user ? (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-sand"
              >
                <User size={17} />
                {user.name.split(" ")[0]}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-sand bg-white py-1 shadow-card">
                  <Link
                    href={dashboardHref}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-ink/70 hover:bg-sand"
                  >
                    <LayoutDashboard size={15} /> Dashboard
                  </Link>
                  {user?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-ink/70 hover:bg-sand"
                    >
                      <ShieldCheck size={15} /> Admin panel
                    </Link>
                  )}
                  <button
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-ink/70 hover:bg-sand"
                  >
                    <LogOut size={15} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-sand sm:flex"
            >
              <User size={17} />
              Sign in
            </Link>
          )}
          <Link
            href="/cart"
            className="relative rounded-full p-2 text-ink transition hover:bg-sand"
            aria-label="Cart"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-semibold leading-none text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-sand bg-cream px-4 py-3 md:hidden">
          <form method="GET" action="/search" className="mb-2">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                type="text"
                name="q"
                placeholder="Search handmade goods…"
                className="w-full rounded-full border border-sand bg-white py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </form>
          {staticNavLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2 py-2 text-sm font-medium text-ink/80 hover:bg-sand"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={sellHref}
            className="rounded-md px-2 py-2 text-sm font-medium text-ink/80 hover:bg-sand"
            onClick={() => setOpen(false)}
          >
            Sell on Shoppan
          </Link>
          {user ? (
            <>
              <Link
                href={dashboardHref}
                className="rounded-md px-2 py-2 text-sm font-medium text-ink/80 hover:bg-sand"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-md px-2 py-2 text-sm font-medium text-ink/80 hover:bg-sand"
                  onClick={() => setOpen(false)}
                >
                  Admin panel
                </Link>
              )}
              <button
                onClick={() => { setOpen(false); logout(); }}
                className="rounded-md px-2 py-2 text-left text-sm font-medium text-ink/80 hover:bg-sand"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md px-2 py-2 text-sm font-medium text-ink/80 hover:bg-sand"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
