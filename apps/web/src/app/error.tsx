"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-28 text-center">
      <p className="font-serif text-3xl font-semibold text-ink">Something went wrong</p>
      <p className="mt-3 text-sm text-ink/55">
        An unexpected error occurred. Try refreshing the page or going back home.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white hover:bg-ink/90"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-sand px-6 py-3 text-sm font-semibold text-ink hover:bg-sand"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
