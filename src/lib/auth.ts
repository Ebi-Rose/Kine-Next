import { supabase } from "./supabase";

/** True only when explicitly opted in during local development */
export function isDevBypass(): boolean {
  return process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_BYPASS === "true";
}

export async function getSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Returns true if the user has a real Supabase session.
 * Dev bypass is the only shortcut — no demo or localhost bypass in production.
 */
export async function isAuthenticated(): Promise<boolean> {
  if (isDevBypass()) return true;
  const session = await getSession();
  return !!session;
}

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email: email.trim(), password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signInWithOAuth(provider: "google" | "apple") {
  const redirectTo = window.location.origin + "/login";
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
  // Clear server-side httpOnly cookies
  try { await fetch("/api/logout", { method: "POST" }); } catch {}
  localStorage.removeItem("kine_v2");
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  window.location.href = "/";
}

export async function resetPassword(email: string) {
  const redirectTo = window.location.origin + "/update-password";
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

export function onAuthStateChange(
  callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]
) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function getSubscriptionStatus() {
  if (isDevBypass()) {
    return { active: true };
  }

  const user = await getUser();
  if (!user) return { active: false };

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      console.warn("[Kinē] Subscription check failed:", error?.message || "no data", "user:", user.id);
      return { active: false };
    }

    const isActive = data.status === "active" || data.status === "trialing";
    return {
      active: isActive,
      status: data.status as string,
      plan: data.plan as string,
      currentPeriodEnd: data.current_period_end as string,
      cancelAtPeriodEnd: data.cancel_at_period_end as boolean,
      stripeCustomerId: data.stripe_customer_id as string,
    };
  } catch {
    return { active: false };
  }
}
