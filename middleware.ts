import { NextRequest, NextResponse } from "next/server";

// API routes that must work without auth (crons, auth handlers, analytics beacon)
const PUBLIC_API_PREFIXES = [
  "/api/auth",                // NextAuth handlers
  "/api/demos/sync",          // cron
  "/api/people/sync",         // cron
  "/api/voting-period/close", // cron
  "/api/analytics/compute",   // cron
  "/api/analytics/collect",   // beacon from authenticated pages
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public pages and assets
  if (pathname === "/signin") return NextResponse.next();

  // API routes: only allow specific public endpoints unauthenticated
  if (pathname.startsWith("/api")) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
    if (isPublicApi) return NextResponse.next();

    // All other API routes require a valid session cookie
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  // Page routes: require session cookie, redirect to signin if missing
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  if (!sessionToken) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|goat1.jpg|launch-deck.html|how-we-work.html|opengraph-image).*)",
  ],
};
