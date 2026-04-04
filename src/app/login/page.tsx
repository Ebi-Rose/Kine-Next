"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signUp, signIn, signInWithOAuth, resetPassword, isAuthenticated, getSubscriptionStatus } from "@/lib/auth";
import PwaHead from "@/components/PwaHead";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

type View = "auth" | "forgot" | "confirm-email";

/** Check auth + subscription and route accordingly */
async function routeAuthenticatedUser() {
  const sub = await getSubscriptionStatus();
  if (sub.active) {
    window.location.href = "/app";
  } else {
    window.location.href = "/pricing";
  }
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-10-7-10-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 10 7 10 7a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  minLength,
  id,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  minLength?: number;
  id?: string;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        className="w-full rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 pr-10 text-sm text-text placeholder:text-muted outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted2 hover:text-text transition-colors rounded"
        aria-label={show ? "Hide password" : "Show password"}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <PwaHead />
      <ServiceWorkerRegistrar />
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("view") === "signup" ? "signup" : "login";
  const [view, setView] = useState<View>("auth");
  const [confirmEmail, setConfirmEmail] = useState("");
  const router = useRouter();

  // Auto-redirect if already authenticated
  useEffect(() => {
    isAuthenticated().then((ok) => {
      if (ok) routeAuthenticatedUser();
    });
  }, [router]);

  if (view === "confirm-email") {
    return (
      <div className="min-h-screen bg-bg font-body flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="font-display text-2xl tracking-[0.2em] text-accent">KINĒ</div>
          <h2 className="mt-6 font-display text-2xl tracking-wide text-text">Check your email</h2>
          <p className="mt-3 text-sm text-muted2">
            We sent a confirmation link to <strong className="text-text">{confirmEmail}</strong>.
            Click it to activate your account, then come back to log in.
          </p>
          <button
            onClick={() => setView("auth")}
            className="mt-6 text-sm text-accent hover:underline"
          >
            Go to login &rarr;
          </button>
        </div>
      </div>
    );
  }

  if (view === "forgot") {
    return (
      <div className="min-h-screen bg-bg font-body">
        <ForgotView onBack={() => setView("auth")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-body">
      <AuthView
        initialTab={initialTab as "login" | "signup"}
        onForgot={() => setView("forgot")}
        onConfirmEmail={(email) => { setConfirmEmail(email); setView("confirm-email"); }}
      />
    </div>
  );
}

function AuthView({
  initialTab,
  onForgot,
  onConfirmEmail,
}: {
  initialTab: "login" | "signup";
  onForgot: () => void;
  onConfirmEmail: (email: string) => void;
}) {
  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchTab(t: "login" | "signup") {
    setTab(t);
    setError("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (tab === "signup" && !ageConfirmed) {
      setError("Please confirm you are at least 18 years old.");
      return;
    }

    setLoading(true);

    if (tab === "signup") {
      const { data, error: authError } = await signUp(email, password);
      setLoading(false);

      if (authError) {
        const msg = authError.message?.toLowerCase() || "";
        if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("duplicate")) {
          setError("Check your email for a confirmation link, or try logging in.");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data?.user && !data.session) {
        onConfirmEmail(email);
        return;
      }

      await routeAuthenticatedUser();
    } else {
      const { error: authError } = await signIn(email, password);
      setLoading(false);

      if (authError) {
        setError("Invalid email or password.");
        return;
      }

      await routeAuthenticatedUser();
    }
  }

  async function handleGoogle() {
    await signInWithOAuth("google");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <a href="/" className="text-xs text-muted2 hover:text-text transition-colors">
          &larr; Back
        </a>

        <div className="mt-6 font-display text-2xl tracking-[0.2em] text-accent">KINĒ</div>
        <p className="mt-3 text-xs text-muted2">
          Structured training that adapts to your body.
        </p>

        {/* Pill toggle */}
        <div className="mt-5 flex rounded-[10px] border border-border bg-surface p-[3px]">
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 rounded-[8px] py-2.5 text-xs transition-all ${
              tab === "login"
                ? "bg-accent-dim text-accent border border-accent/20"
                : "text-muted border border-transparent"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => switchTab("signup")}
            className={`flex-1 rounded-[8px] py-2.5 text-xs transition-all ${
              tab === "signup"
                ? "bg-accent-dim text-accent border border-accent/20"
                : "text-muted border border-transparent"
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text transition-all hover:border-border-active"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            aria-label="Email address"
            aria-describedby={error ? "auth-error" : undefined}
            aria-invalid={error ? "true" : undefined}
            autoComplete="email"
            required
            className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder={tab === "signup" ? "Create password" : "Password"}
            minLength={tab === "signup" ? 8 : undefined}
            autoComplete={tab === "signup" ? "new-password" : "current-password"}
          />

          {tab === "signup" && (
            <>
              <p className="text-[10px] text-muted -mt-1">Must be at least 8 characters</p>
              <label className="flex items-start gap-2 mt-1">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
                />
                <span className="text-[11px] text-muted2 leading-snug">
                  I confirm I am at least 18 years old
                </span>
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (tab === "signup" && !ageConfirmed)}
            className="mt-1 rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading
              ? (tab === "signup" ? "Creating..." : "Logging in...")
              : (tab === "signup" ? "CREATE ACCOUNT \u2192" : "LOG IN \u2192")
            }
          </button>
        </form>

        {error && (
          <p id="auth-error" role="alert" className="mt-3 text-center text-xs text-[#ff8a80]">{error}</p>
        )}

        {tab === "login" && (
          <button
            onClick={onForgot}
            className="mt-3 block w-full text-center text-xs text-muted2 hover:text-accent transition-colors"
          >
            Forgot password?
          </button>
        )}

        {tab === "signup" && (
          <p className="mt-4 text-center text-[10px] text-muted">
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-accent underline underline-offset-2">Terms</a> &{" "}
            <a href="/privacy" className="text-accent underline underline-offset-2">Privacy Policy</a>
          </p>
        )}
      </div>
    </div>
  );
}

function ForgotView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    await resetPassword(email);
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="font-display text-2xl tracking-[0.2em] text-accent">KINĒ</div>
          <h2 className="mt-6 font-display text-2xl tracking-wide text-text">Check your inbox</h2>
          <p className="mt-3 text-sm text-muted2">
            We sent a password reset link to <strong className="text-text">{email}</strong>.
            It may take a minute to arrive.
          </p>
          <p className="mt-2 text-xs text-muted">
            Don&apos;t see it? Check your spam folder.
          </p>
          <button
            onClick={onBack}
            className="mt-6 text-sm text-accent hover:underline"
          >
            Back to login &rarr;
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <button
          onClick={onBack}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          &larr; Back to login
        </button>

        <div className="mt-6 font-display text-2xl tracking-[0.2em] text-accent">KINĒ</div>

        <h2 className="mt-4 font-display text-2xl tracking-wide text-text">
          Reset your password
        </h2>
        <p className="mt-1 text-xs text-muted2">
          Enter the email you signed up with and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={handleReset} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            aria-label="Email address"
            aria-describedby={error ? "reset-error" : undefined}
            aria-invalid={error ? "true" : undefined}
            autoComplete="email"
            required
            autoFocus
            className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Sending..." : "SEND RESET LINK"}
          </button>
        </form>

        {error && (
          <p id="reset-error" role="alert" className="mt-3 text-center text-xs text-[#ff8a80]">{error}</p>
        )}
      </div>
    </div>
  );
}
