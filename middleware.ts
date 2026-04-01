export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // Protect everything except public assets and auth routes
    "/((?!api/auth|signin|_next/static|_next/image|favicon.ico|icon.svg|goat1.jpg|launch-deck.html|how-we-work.html|opengraph-image).*)",
  ],
};
