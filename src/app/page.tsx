"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isAuthenticated } from "@/lib/auth";

export default function LandingPage() {
  const router = useRouter();

  // If already authenticated, go straight to app
  useEffect(() => {
    isAuthenticated().then((ok) => {
      if (ok) router.replace("/app");
    });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-bg font-body">
      <div className="font-display text-5xl tracking-[0.3em] text-accent">KINĒ</div>
      <div className="mt-2 text-[10px] tracking-[0.4em] text-muted2 uppercase">
        Train with intention
      </div>

      <h1 className="mt-12 font-display text-4xl leading-tight tracking-wide text-text md:text-5xl">
        Strength training<br />
        <span className="text-accent">built for women.</span>
      </h1>

      <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted2">
        Personalized programming that adapts to your body, your cycle, and your life.
        AI-powered coaching that meets you where you are.
      </p>

      <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
        <a
          href="/access"
          className="rounded-[var(--radius-default)] bg-accent px-8 py-3 text-sm font-medium text-bg transition-all hover:brightness-110 active:scale-[0.97] text-center"
        >
          I HAVE ACCESS →
        </a>
      </div>

      <ul className="mt-12 flex flex-col gap-2 text-xs text-muted2 text-left">
        <li>✓ Periodized weekly programs</li>
        <li>✓ Cycle-aware adjustments</li>
        <li>✓ AI session coaching</li>
        <li>✓ Progress tracking</li>
        <li>✓ Works offline</li>
      </ul>

      <p className="mt-12 text-[10px] text-muted">
        Currently in private beta.
      </p>
    </div>
  );
}
