import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAILS = ["drew.kull@klaviyo.com"];

export function middleware(request: NextRequest) {
  // Only protect /admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const email = request.cookies.get("bka_user_email")?.value;

    if (!email) {
      // Redirect to home with a message
      return NextResponse.redirect(new URL("/?auth=required", request.url));
    }

    const normalized = email.toLowerCase().trim().replace(/\+.*@/, "@");
    if (!ADMIN_EMAILS.includes(normalized)) {
      return NextResponse.redirect(new URL("/?auth=denied", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
