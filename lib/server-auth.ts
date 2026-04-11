import { auth } from "@/auth";
import { createServerSupabase } from "@/lib/supabase";

/**
 * Get the authenticated user's email from the Okta session.
 * Returns null if not authenticated.
 */
export async function getSessionEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

/**
 * Check if the authenticated user is an admin.
 * Checks against the admin_emails list in Supabase config.
 * Falls back to hardcoded list if Supabase is unavailable.
 */
export async function requireAdmin(): Promise<{ email: string } | null> {
  const email = await getSessionEmail();
  if (!email) return null;

  const normalized = email.toLowerCase().trim();

  // Check Supabase config for admin emails
  try {
    const supabase = createServerSupabase();
    const { data } = await supabase
      .from("config")
      .select("value")
      .eq("key", "admin_emails")
      .single();
    const adminEmails = (data?.value as string[]) ?? [];
    if (adminEmails.includes(normalized)) return { email: normalized };
  } catch {}

  // Fallback hardcoded list
  const FALLBACK_ADMINS = ["drew.kull@klaviyo.com"];
  if (FALLBACK_ADMINS.includes(normalized)) return { email: normalized };

  return null;
}
