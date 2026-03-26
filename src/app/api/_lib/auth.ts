import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Verify the Supabase access token from the Authorization header
 * and return the authenticated user. Returns null if invalid.
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) return null;

  const supabase = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}
