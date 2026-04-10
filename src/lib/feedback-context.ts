"use client";

import { appNow } from "@/lib/dev-time";

// Lightweight in-memory context tracker for beta feedback.
// Records recent navigation + JS errors as the user moves around the app,
// then snapshots everything (plus zustand state, viewport, sentry breadcrumbs)
// when feedback is submitted.

type RouteEntry = { path: string; at: number };
type ErrorEntry = { message: string; source?: string; line?: number; at: number };

const MAX_ROUTES = 10;
const MAX_ERRORS = 5;

const routeHistory: RouteEntry[] = [];
const errorHistory: ErrorEntry[] = [];

let installed = false;

export function installFeedbackContext() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Capture uncaught errors
  window.addEventListener("error", (e) => {
    pushError({
      message: e.message || String(e.error ?? "unknown error"),
      source: e.filename,
      line: e.lineno,
      at: Date.now(),
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason;
    pushError({
      message: typeof reason === "string"
        ? reason
        : reason?.message ?? "unhandled promise rejection",
      at: Date.now(),
    });
  });
}

export function trackRoute(path: string) {
  if (typeof window === "undefined") return;
  // Avoid duplicates back-to-back
  if (routeHistory.length > 0 && routeHistory[routeHistory.length - 1].path === path) return;
  routeHistory.push({ path, at: Date.now() });
  if (routeHistory.length > MAX_ROUTES) routeHistory.shift();
}

function pushError(entry: ErrorEntry) {
  errorHistory.push(entry);
  if (errorHistory.length > MAX_ERRORS) errorHistory.shift();
}

export interface FeedbackContext {
  // Identity
  user: {
    id: string | null;
    email: string | null;
    name: string | null;
    plan: string | null;
    signedUpAt: string | null;
  };
  // Current app state
  app: {
    route: string;
    viewport: { w: number; h: number };
    devicePixelRatio: number;
    locale: string;
    timezone: string;
    timestampIso: string;
    online: boolean;
    standalone: boolean; // PWA installed
  };
  // Kine domain state (best-effort, won't crash if store missing)
  kine: Record<string, unknown>;
  // Recent breadcrumbs
  recentRoutes: RouteEntry[];
  recentErrors: ErrorEntry[];
  sentryBreadcrumbs?: unknown[];
}

interface UserLike {
  id?: string;
  email?: string;
  user_metadata?: { name?: string; full_name?: string; plan?: string };
  created_at?: string;
}

interface KineSnapshot {
  goal?: unknown;
  experience?: unknown;
  currentDayIdx?: number | null;
  progressDB?: { currentWeek?: number; programStartDate?: string | null };
  weekData?: { weekNumber?: number; phase?: string } | null;
  sessionMode?: unknown;
  units?: unknown;
}

export async function collectContext(): Promise<FeedbackContext> {
  const route = typeof window !== "undefined" ? window.location.pathname : "";

  // Identity (lazy import to keep this file framework-agnostic)
  let user: UserLike | null = null;
  try {
    const { getUser } = await import("@/lib/auth");
    user = (await getUser()) as UserLike | null;
  } catch { /* ignore */ }

  // Kine zustand state snapshot — only fields useful for triage
  let kine: Record<string, unknown> = {};
  try {
    const mod = await import("@/store/useKineStore");
    // useKineStore is a zustand hook with .getState()
    const store = (mod as { useKineStore?: { getState?: () => KineSnapshot } }).useKineStore;
    const state = store?.getState?.();
    if (state) {
      kine = {
        goal: state.goal ?? null,
        experience: state.experience ?? null,
        currentDayIdx: state.currentDayIdx ?? null,
        currentWeek: state.progressDB?.currentWeek ?? null,
        programStartDate: state.progressDB?.programStartDate ?? null,
        weekNumber: state.weekData?.weekNumber ?? null,
        phase: state.weekData?.phase ?? null,
        sessionMode: state.sessionMode ?? null,
        units: state.units ?? null,
      };
    }
  } catch { /* ignore */ }

  // Sentry breadcrumbs if available
  let sentryBreadcrumbs: unknown[] | undefined;
  try {
    const Sentry = await import("@sentry/nextjs");
    const scope = Sentry.getCurrentScope();
    // @ts-expect-error breadcrumbs accessor varies by version
    sentryBreadcrumbs = scope?._breadcrumbs ?? scope?.getScopeData?.()?.breadcrumbs;
  } catch { /* ignore */ }

  const meta = (user?.user_metadata ?? {}) as { name?: string; full_name?: string; plan?: string };

  return {
    user: {
      id: user?.id ?? null,
      email: user?.email ?? null,
      name: meta.name ?? meta.full_name ?? null,
      plan: meta.plan ?? null,
      signedUpAt: user?.created_at ?? null,
    },
    app: {
      route,
      viewport: typeof window !== "undefined"
        ? { w: window.innerWidth, h: window.innerHeight }
        : { w: 0, h: 0 },
      devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
      locale: typeof navigator !== "undefined" ? navigator.language : "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestampIso: appNow().toISOString(),
      online: typeof navigator !== "undefined" ? navigator.onLine : true,
      standalone: typeof window !== "undefined"
        && (window.matchMedia?.("(display-mode: standalone)").matches
          || (window.navigator as Navigator & { standalone?: boolean }).standalone === true),
    },
    kine,
    recentRoutes: [...routeHistory],
    recentErrors: [...errorHistory],
    sentryBreadcrumbs,
  };
}
