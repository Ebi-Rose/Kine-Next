"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp, signIn, signInWithOAuth, resetPassword, isAuthenticated } from "@/lib/auth";
import { useEffect } from "react";

type Page = "hero" | "auth" | "login" | "key";

export default function MarketingPage() {
  const [page, setPage] = useState<Page>("hero");
  const router = useRouter();

  // Auto-redirect if already authenticated
  useEffect(() => {
    isAuthenticated().then((ok) => {
      if (ok) router.replace("/app");
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-bg font-body">
      {page === "hero" && <HeroPage onNavigate={setPage} />}
      {page === "auth" && <AuthPage onNavigate={setPage} />}
      {page === "login" && <LoginPage onNavigate={setPage} />}
      {page === "key" && <KeyPage onNavigate={setPage} />}
    </div>
  );
}

// ── Hero ──

function HeroPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="font-display text-4xl tracking-[0.3em] text-accent">KINĒ</div>
      <div className="mt-2 text-[10px] tracking-[0.4em] text-muted2 uppercase">
        Train with intention
      </div>

      <h1 className="mt-10 font-display text-4xl leading-tight tracking-wide text-text md:text-5xl">
        Strength training<br />
        <span className="text-accent">built for women.</span>
      </h1>

      <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted2">
        Personalized programming that adapts to your body, your cycle, and your life.
      </p>

      <button
        onClick={() => onNavigate("auth")}
        className="mt-8 rounded-[var(--radius-default)] bg-accent px-8 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 active:scale-[0.97]"
      >
        GET STARTED →
      </button>

      <p className="mt-3 text-xs text-muted2">
        Already have an account?{" "}
        <button
          onClick={() => onNavigate("login")}
          className="text-accent hover:underline"
        >
          Log in
        </button>
      </p>

      <div className="mt-10 flex items-center gap-3 text-[10px] text-muted">
        <a href="/app?demo=true" className="hover:text-text transition-colors">
          Try demo
        </a>
        <span>·</span>
        <button
          onClick={() => onNavigate("key")}
          className="hover:text-text transition-colors"
        >
          Access key
        </button>
      </div>
    </div>
  );
}

// ── Sign Up ──

function AuthPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await signUp(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/app");
  }

  async function handleGoogle() {
    await signInWithOAuth("google");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <button
          onClick={() => onNavigate("hero")}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          ← Back
        </button>

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
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}

// ── Login ──

function LoginPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

    router.push("/app");
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
      alert("Password reset email sent. Check your inbox.");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <button
          onClick={() => onNavigate("hero")}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          ← Back
        </button>

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

        <button
          onClick={handleForgot}
          className="mt-3 block w-full text-center text-xs text-muted2 hover:text-accent transition-colors"
        >
          Forgot password?
        </button>

        <p className="mt-4 text-center text-xs text-muted2">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => onNavigate("auth")}
            className="text-accent hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Access Key ──

function KeyPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [key, setKey] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (key.trim()) {
      router.push(`/app?key=${encodeURIComponent(key.trim())}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <button
          onClick={() => onNavigate("hero")}
          className="text-xs text-muted2 hover:text-text transition-colors"
        >
          ← Back
        </button>

        <h2 className="mt-6 font-display text-2xl tracking-wide text-text">
          Access key
        </h2>
        <p className="mt-1 text-xs text-muted2">
          Enter your key to access the app.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter access key"
            className="rounded-[var(--radius-default)] border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-[var(--radius-default)] bg-accent px-4 py-3 text-sm font-medium text-bg transition-all hover:brightness-110"
          >
            CONTINUE
          </button>
        </form>
      </div>
    </div>
  );
}
