"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-text p-6">
      <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
      <p className="text-muted2 mb-6 text-center max-w-sm">
        An unexpected error occurred. Try refreshing, or head back to the home page.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl bg-accent text-white font-medium"
        >
          Try again
        </button>
        <a
          href="/"
          className="px-5 py-2.5 rounded-xl border border-border text-text font-medium"
        >
          Home
        </a>
      </div>
    </div>
  );
}
