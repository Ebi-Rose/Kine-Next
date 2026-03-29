"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  // Supabase handles the token exchange automatically via onAuthStateChange
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if we already have a session (token may have been exchanged already)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-bg font-body">
        <div className="w-full max-w-sm text-center">
          <div className="font-display text-2xl tracking-[0.2em] text-accent">KINĒ</div>
          <h2 className="mt-6 font-display text-2xl tracking-wide text-text">Password updated</h2>
          <p className="mt-3 text-sm text-muted2">
            Your password has been changed successfully.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-6 rounded-[var(--radius-default)] bg-accent px-6 py-3 text-sm font-medium text-bg transition-all hover:brightness-110"
          >
            LOG IN →
          </button>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-bg font-body">
        <div className="w-full max-w-sm text-center">
          <div className="font-display text-2xl tracking-[0.2em] text-accent">KINĒ</div>
          <p className="mt-6 text-sm text-muted2">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 bg-bg font-body">
      <div className="w-full max-w-sm">
        <div className="font-display text-2xl tracking-[0.2em] text-accent">KINĒ</div>

        <h2 className="mt-4 font-display text-2xl tracking-wide text-text">
          Set new password
        </h2>
        <p className="mt-1 text-xs text-muted2">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              aria-label="New password"
              aria-invalid={!!error}
              aria-describedby={error ? "pw-error" : "pw-hint"}
              autoComplete="new-password"
              required
              minLength={6}
              autoFocus
              className="w-full rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 pr-10 text-sm text-text placeholder:text-muted outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted2 hover:text-text transition-colors rounded"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-10-7-10-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>
          <p id="pw-hint" className="text-[10px] text-muted -mt-1">Must be at least 6 characters</p>
          <input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            aria-invalid={!!error}
            aria-describedby={error ? "pw-error" : undefined}
            autoComplete="new-password"
            required
            minLength={6}
            className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Updating..." : "UPDATE PASSWORD"}
          </button>
        </form>

        {error && (
          <p id="pw-error" className="mt-3 text-center text-xs text-[#ff8a80]" role="alert">{error}</p>
        )}
      </div>
    </div>
  );
}
