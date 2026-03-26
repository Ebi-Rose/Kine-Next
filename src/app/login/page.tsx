"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signUp, signIn, signInWithOAuth, resetPassword, isAuthenticated, getSubscriptionStatus } from "@/lib/auth";

type View = "signup" | "login";

/** Check auth + subscription and route accordingly */
async function routeAuthenticatedUser(router: ReturnType<typeof useRouter>) {
  const sub = await getSubscriptionStatus();
  if (sub.active) {
    router.replace("/app");
  } else {
    router.replace("/pricing");
  }
}

export default function LoginPage() {
  const [view, setView] = useState<View>("signup");
  const router = useRouter();

  // Auto-redirect if already authenticated
  useEffect(() => {
    isAuthenticated().then((ok) => {
      if (ok) routeAuthenticatedUser(router);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-bg font-body">
      {view === "signup" && <SignupView onSwitch={() => setView("login")} />}
      {view === "login" && <LoginView onSwitch={() => setView("signup")} />}
    </div>
  );
}

function SignupView({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: authError } = await signUp(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    // If email confirmation is required, Supabase returns a user without a session
    if (data?.user && !data.session) {
      setConfirmEmail(true);
      return;
    }

    // New signup — no subscription yet, go to pricing
    router.push("/pricing");
  }

  async function handleGoogle() {
    await signInWithOAuth("google");
  }

  if (confirmEmail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h2 className="font-display text-2xl tracking-wide text-text">Check your email</h2>
          <p className="mt-3 text-sm text-muted2">
            We sent a confirmation link to <strong className="text-text">{email}</strong>.
            Click it to activate your account, then come back to log in.
          </p>
          <button
            onClick={onSwitch}
            className="mt-6 text-sm text-accent hover:underline"
          >
            Go to login →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <a href="/" className="text-xs text-muted2 hover:text-text transition-colors">
          ← Back
        </a>

        <h2 className="mt-6 font-display text-2xl tracking-wide text-text">
          Create your account
        </h2>
        <p className="mt-1 text-xs text-muted2">
          Full access. 14-day money-back guarantee.
        </p>

        <button
          onClick={handleGoogle}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text transition-all hover:border-border-active"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create password"
            required
            minLength={6}
            className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Creating..." : "CREATE ACCOUNT"}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-center text-xs text-red-400">{error}</p>
        )}

        <p className="mt-4 text-center text-[10px] text-muted">
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-accent hover:underline">Terms</a> &{" "}
          <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>
        </p>

        <p className="mt-4 text-center text-xs text-muted2">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-accent hover:underline">
            Log in
          </button>
        </p>

      </div>
    </div>
  );
}

function LoginView({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    await routeAuthenticatedUser(router);
  }

  async function handleGoogle() {
    await signInWithOAuth("google");
  }

  async function handleForgot() {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    const { error: resetError } = await resetPassword(email);
    if (resetError) {
      setError(resetError.message);
    } else {
      setError("");
      setResetSent(true);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <a href="/" className="text-xs text-muted2 hover:text-text transition-colors">
          ← Back
        </a>

        <h2 className="mt-6 font-display text-2xl tracking-wide text-text">
          Welcome back
        </h2>
        <p className="mt-1 text-xs text-muted2">
          Log in to pick up where you left off.
        </p>

        <button
          onClick={handleGoogle}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text transition-all hover:border-border-active"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-accent"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "LOG IN"}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-center text-xs text-red-400">{error}</p>
        )}

        {resetSent && (
          <p className="mt-3 text-center text-xs text-green-400">
            Password reset email sent. Check your inbox.
          </p>
        )}

        <button
          onClick={handleForgot}
          className="mt-3 block w-full text-center text-xs text-muted2 hover:text-accent transition-colors"
        >
          Forgot password?
        </button>

        <p className="mt-4 text-center text-xs text-muted2">
          Don&apos;t have an account?{" "}
          <button onClick={onSwitch} className="text-accent hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
