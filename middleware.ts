import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes entirely — cron jobs and internal calls need unauthenticated access
  if (pathname.startsWith("/api")) return NextResponse.next();

  // Skip public pages and assets
  if (pathname === "/signin") return NextResponse.next();

  // Check for NextAuth session cookie
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
