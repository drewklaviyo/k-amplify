// =============================================================================
// Portable Analytics — K:Amplify
// Requires: analytics_sessions, analytics_events, analytics_daily tables
// =============================================================================

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a session hash from user email + user agent + date.
 * Uses Web Crypto API (available in all modern browsers).
 * Counter suffix handles 30-min inactivity resets within the same day.
 */
export async function generateSessionHash(
  email: string,
  counter: number = 0,
): Promise<string> {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "server";
  const raw = `${email}|${ua}|${date}|${counter}`;
  const encoded = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if the session has expired due to inactivity.
 */
export function isSessionExpired(lastEventTime: number): boolean {
  return Date.now() - lastEventTime > INACTIVITY_TIMEOUT_MS;
}

/**
 * Parse basic browser/OS/device info from user agent.
 * Lightweight — no external dependency.
 */
export function parseUserAgent(): {
  browser: string;
  os: string;
  device: string;
  screen: string;
} {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

  let browser = "Unknown";
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/")) browser = "Safari";

  let os = "Unknown";
  if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  const device =
    /Mobi|Android|iPhone|iPad/i.test(ua) ? "Mobile" : "Desktop";

  const screen =
    typeof window !== "undefined"
      ? `${window.screen.width}x${window.screen.height}`
      : "unknown";

  return { browser, os, device, screen };
}
