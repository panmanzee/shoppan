import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <p className="font-serif text-5xl font-semibold text-ink">404</p>
      <p className="mt-3 text-sm text-ink/55">
        We couldn&apos;t find that page — it may have been moved or the listing sold out.
      </p>
      <Link href="/" className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90">
        Back to home
      </Link>
    </div>
  );
}
