"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.mode === "demo") {
          router.push("/app?demo=true&mode=demo");
        } else if (data.mode === "new") {
          router.push("/app?demo=true&mode=new");
        } else {
          router.push("/login");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Invalid access code.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-bg font-body">
      <div className="w-full max-w-sm">
        <a href="/" className="text-xs text-muted2 hover:text-text transition-colors">
          ← Back
        </a>

        <div className="mt-6 font-display text-2xl tracking-[0.2em] text-accent">KINĒ</div>

        <h2 className="mt-4 font-display text-2xl tracking-wide text-text">
          Enter access code
        </h2>
        <p className="mt-1 text-xs text-muted2">
          Kinē is currently in private beta. Enter your code to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            placeholder="Access code"
            autoFocus
            className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Checking..." : "CONTINUE →"}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-center text-xs text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}
