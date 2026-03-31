import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyCsrf } from "../_lib/csrf";

/**
 * Clears all server-side httpOnly cookies on sign out.
 */
export async function POST(request: NextRequest) {
  if (!verifyCsrf(request)) {
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  }
  const cookieStore = await cookies();
  cookieStore.delete("kine_sub");
  cookieStore.delete("kine_access");
  return Response.json({ ok: true });
}
