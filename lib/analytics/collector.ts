// =============================================================================
// Portable Analytics — K:Amplify
// Requires: analytics_sessions, analytics_events, analytics_daily tables
// =============================================================================

export interface AnalyticsEvent {
  type: "pageview" | "click" | "feature";
  name: string;
  path: string;
  title?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
  ts: number;
}

const FLUSH_INTERVAL_MS = 5_000;
const BUFFER_MAX = 20;

let buffer: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let sessionId: string | null = null;

/**
 * Initialize the collector with the current session ID.
 * Starts the periodic flush timer and registers unload handler.
 */
export function initCollector(sid: string): void {
  sessionId = sid;

  // Periodic flush
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(() => {
    if (buffer.length > 0) flush();
  }, FLUSH_INTERVAL_MS);

  // Flush on page unload
  if (typeof window !== "undefined") {
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && buffer.length > 0) {
        flushBeacon();
      }
    });
  }
}

/**
 * Push an event into the buffer. Auto-flushes if buffer is full.
 */
export function pushEvent(event: AnalyticsEvent): void {
  buffer.push(event);
  if (buffer.length >= BUFFER_MAX) {
    flush();
  }
}

/**
 * Flush buffered events via fetch POST.
 */
export async function flush(): Promise<void> {
  if (buffer.length === 0 || !sessionId) return;

  const events = [...buffer];
  buffer = [];

  try {
    await fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, events }),
    });
  } catch (err) {
    // Re-add events to buffer on failure (best-effort)
    console.warn("[analytics] flush failed, re-queuing", err);
    buffer = [...events, ...buffer].slice(0, BUFFER_MAX * 2);
  }
}

/**
 * Flush via navigator.sendBeacon (for page unload — cannot use async fetch).
 */
function flushBeacon(): void {
  if (buffer.length === 0 || !sessionId) return;

  const events = [...buffer];
  buffer = [];

  const payload = JSON.stringify({ sessionId, events });
  navigator.sendBeacon("/api/analytics/collect", payload);
}

/**
 * Update the session ID (e.g., after inactivity reset).
 */
export function updateSessionId(sid: string): void {
  sessionId = sid;
}

/**
 * Destroy the collector — clear timer, flush remaining events.
 */
export function destroyCollector(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  if (buffer.length > 0) {
    flushBeacon();
  }
}
