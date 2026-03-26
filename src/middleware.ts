import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side route protection for /app/* routes.
 *
 * Checks for the signed httpOnly `kine_access` cookie. If missing,
 * redirects to /access before any page HTML is served.
 *
 * Full signature verification happens in /api/check-access (Node.js runtime).
 * This middleware is a fast gate to prevent unauthenticated HTML exposure.
 */
export function middleware(request: NextRequest) {
  const accessCookie = request.cookies.get("kine_access")?.value;

  if (!accessCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/access";
    return NextResponse.redirect(url);
  }

  // Cookie exists — allow through. AuthGuard does full validation client-side.
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
