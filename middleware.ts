export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // Protect pages only — exclude all API routes, public assets, and auth
    "/((?!api|signin|_next/static|_next/image|favicon.ico|icon.svg|goat1.jpg|launch-deck.html|how-we-work.html|opengraph-image).*)",
  ],
};
