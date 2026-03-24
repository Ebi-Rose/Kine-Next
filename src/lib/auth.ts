import { supabase } from "./supabase";

/** True if dev bypass env var is set (local development only) */
export function isDevBypass(): boolean {
  return process.env.NEXT_PUBLIC_DEV_BYPASS === "true";
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
  return supabase.auth.signUp({ email, password });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
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
  localStorage.removeItem("kine_v2");
  window.location.href = "/";
}

export async function resetPassword(email: string) {
  const redirectTo = window.location.origin + "/login";
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
  if (!user) {
    console.log("[auth] getSubscriptionStatus: no user");
    return { active: false };
  }

  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      console.log("[auth] getSubscriptionStatus: no subscription row", error?.message);
      return { active: false };
    }

    const isActive = data.status === "active" || data.status === "trialing";
    console.log("[auth] getSubscriptionStatus:", data.status, "active:", isActive);
    return {
      active: isActive,
      status: data.status as string,
      plan: data.plan as string,
      currentPeriodEnd: data.current_period_end as string,
      cancelAtPeriodEnd: data.cancel_at_period_end as boolean,
      stripeCustomerId: data.stripe_customer_id as string,
    };
  } catch (e) {
    console.log("[auth] getSubscriptionStatus: error", e);
    return { active: false };
  }
}
