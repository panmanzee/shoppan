import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-sand bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="col-span-2 md:col-span-1">
          <p className="font-serif text-xl font-semibold text-ink">Shoppan</p>
          <p className="mt-2 max-w-xs text-sm text-ink/60">
            A marketplace for independent makers — and the people who love
            shopping small.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Shop</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li><Link href="/products" className="hover:text-ink">All products</Link></li>
            <li><Link href="/sellers" className="hover:text-ink">Browse makers</Link></li>
            <li><Link href="/pricing" className="hover:text-ink">Shoppan+ membership</Link></li>
            <li><Link href="/cart" className="hover:text-ink">Your cart</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Sell</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li><Link href="/dashboard/seller" className="hover:text-ink">Seller dashboard</Link></li>
            <li><Link href="/pricing" className="hover:text-ink">Seller plans</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li><Link href="/" className="hover:text-ink">About</Link></li>
            <li><Link href="/" className="hover:text-ink">Help center</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sand px-4 py-5 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} Shoppan — a portfolio project, not a real store.
      </div>
    </footer>
  );
}
