"use client";

export default function SessionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="font-display text-xl tracking-wide">Session error</h2>
      <p className="text-sm text-muted">
        {error.message || "Something went wrong during your session."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
        <a
          href="/app"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
