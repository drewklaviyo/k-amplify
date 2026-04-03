// =============================================================================
// Portable Analytics — K:Amplify
// Requires: analytics_sessions, analytics_events, analytics_daily tables
// =============================================================================

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import {
  generateSessionHash,
  isSessionExpired,
  parseUserAgent,
} from "./session";
import {
  initCollector,
  pushEvent,
  updateSessionId,
  destroyCollector,
} from "./collector";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AnalyticsContextValue {
  track: (name: string, metadata?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue>({
  track: () => {},
});

export function useAnalytics(): AnalyticsContextValue {
  return useContext(AnalyticsContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Fetch user from K:Amplify session endpoint
  const [email, setEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/session-info")
      .then((r) => r.json())
      .then((data) => {
        setEmail(data.user?.email ?? null);
        setUserName(data.user?.name ?? null);
      })
      .catch(() => {
        // Not logged in or endpoint unavailable
      });
  }, []);

  const sessionIdRef = useRef<string | null>(null);
  const lastEventTimeRef = useRef<number>(Date.now());
  const counterRef = useRef<number>(0);
  const initDoneRef = useRef(false);
  const prevPathnameRef = useRef<string | null>(null);

  // ---- Session bootstrap ----
  useEffect(() => {
    if (!email) return;

    let cancelled = false;

    async function bootstrap() {
      const hash = await generateSessionHash(email!, counterRef.current);
      const ua = parseUserAgent();

      try {
        const res = await fetch("/api/analytics/collect", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionHash: hash,
            userEmail: email,
            userName,
            ...ua,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        sessionIdRef.current = data.sessionId;
        initCollector(data.sessionId);
        initDoneRef.current = true;
        lastEventTimeRef.current = Date.now();
      } catch (err) {
        console.warn("[analytics] session bootstrap failed", err);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [email, userName]);

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => destroyCollector();
  }, []);

  // ---- Inactivity check + session rotation ----
  const ensureActiveSession = useCallback(async () => {
    if (!email) return;
    if (isSessionExpired(lastEventTimeRef.current)) {
      counterRef.current += 1;
      const hash = await generateSessionHash(email, counterRef.current);
      const ua = parseUserAgent();
      try {
        const res = await fetch("/api/analytics/collect", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionHash: hash,
            userEmail: email,
            userName,
            ...ua,
          }),
        });
        const data = await res.json();
        sessionIdRef.current = data.sessionId;
        updateSessionId(data.sessionId);
      } catch (err) {
        console.warn("[analytics] session rotation failed", err);
      }
    }
    lastEventTimeRef.current = Date.now();
  }, [email, userName]);

  // ---- Auto page view on pathname change ----
  useEffect(() => {
    if (!initDoneRef.current || !sessionIdRef.current) return;
    if (pathname === prevPathnameRef.current) return;
    prevPathnameRef.current = pathname;

    ensureActiveSession().then(() => {
      pushEvent({
        type: "pageview",
        name: "pageview",
        path: pathname,
        title: typeof document !== "undefined" ? document.title : undefined,
        referrer: typeof document !== "undefined" ? document.referrer : undefined,
        ts: Date.now(),
      });
    });
  }, [pathname, ensureActiveSession]);

  // ---- Auto click tracking via data-track ----
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!initDoneRef.current) return;

      // Walk up the DOM to find the nearest data-track attribute
      let el = e.target as HTMLElement | null;
      let trackName: string | null = null;
      while (el && !trackName) {
        trackName = el.getAttribute("data-track");
        el = el.parentElement;
      }
      if (!trackName) return;

      ensureActiveSession().then(() => {
        pushEvent({
          type: "click",
          name: trackName!,
          path: window.location.pathname,
          ts: Date.now(),
        });
      });
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [ensureActiveSession]);

  // ---- Manual track() ----
  const track = useCallback(
    (name: string, metadata?: Record<string, unknown>) => {
      if (!initDoneRef.current) return;
      ensureActiveSession().then(() => {
        pushEvent({
          type: "feature",
          name,
          path:
            typeof window !== "undefined" ? window.location.pathname : "",
          metadata,
          ts: Date.now(),
        });
      });
    },
    [ensureActiveSession],
  );

  return (
    <AnalyticsContext.Provider value={{ track }}>
      {children}
    </AnalyticsContext.Provider>
  );
}
