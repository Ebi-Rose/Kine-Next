import { NextRequest, NextResponse } from "next/server";
import { verifyValue } from "./api/_lib/cookie-sign";

const PUBLIC_ROUTES = ["/", "/access"];
const GATED_ROUTES = ["/login", "/pricing", "/app"];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Always allow public routes and API/static
  if (PUBLIC_ROUTES.includes(path)) {
    return NextResponse.next();
  }

  // Check if this is a gated route
  const isGated = GATED_ROUTES.some(
    (route) => path === route || path.startsWith(route + "/")
  );

  if (!isGated) {
    return NextResponse.next();
  }

  // Verify signed access cookie
  const raw = req.cookies.get("kine_access")?.value;
  const value = raw ? verifyValue(raw) : null;
  if (!value?.startsWith("granted")) {
    return NextResponse.redirect(new URL("/access", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest\\.json|icons/).*)"],
};
