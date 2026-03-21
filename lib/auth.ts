import { cookies } from "next/headers";

const ADMIN_EMAILS = ["drew.kull@klaviyo.com"];

/**
 * Normalize email: lowercase, strip +alias suffixes.
 * e.g., "Drew.Kull+test@klaviyo.com" -> "drew.kull@klaviyo.com"
 */
export function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split("@");
  if (!domain) return lower;
  const stripped = local.replace(/\+.*$/, "");
  return `${stripped}@${domain}`;
}

/**
 * Get the current user session from cookies (pre-Okta).
 * Returns null if not identified.
 */
export async function getSession(): Promise<{
  email: string;
  name: string;
} | null> {
  const cookieStore = await cookies();
  const email = cookieStore.get("bka_user_email")?.value;
  const name = cookieStore.get("bka_user_name")?.value;
  if (!email) return null;
  return { email: normalizeEmail(email), name: name ?? email };
}

/**
 * Check if the current user is an admin.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return ADMIN_EMAILS.includes(session.email);
}

/**
 * Check if a given email is an admin.
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}
