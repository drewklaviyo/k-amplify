// =============================================================================
// Portable Analytics — K:Amplify
// Requires: analytics_sessions, analytics_events, analytics_daily tables
// =============================================================================

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const maxDuration = 10;

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    // Active now: sessions with last_active_at within 5 minutes
    const { data: activeSessions } = await supabase
      .from("analytics_sessions")
      .select("id, user_email, user_name, last_active_at")
      .gte("last_active_at", fiveMinAgo)
      .order("last_active_at", { ascending: false });

    // For each active session, get their most recent pageview
    const activeUsers = [];
    for (const s of activeSessions ?? []) {
      const { data: lastPage } = await supabase
        .from("analytics_events")
        .select("page_path, created_at")
        .eq("session_id", s.id)
        .eq("event_type", "pageview")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      activeUsers.push({
        email: s.user_email,
        name: s.user_name,
        lastActive: s.last_active_at,
        currentPage: lastPage?.page_path ?? "unknown",
        timeOnPage: lastPage
          ? Math.round(
              (Date.now() - new Date(lastPage.created_at).getTime()) / 1000,
            )
          : 0,
      });
    }

    // Recent event stream: last 50 events
    const { data: recentEvents } = await supabase
      .from("analytics_events")
      .select(
        "id, user_email, event_type, event_name, page_path, metadata, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    // Enrich with user names from sessions
    const emailToName = new Map<string, string>();
    for (const s of activeSessions ?? []) {
      if (s.user_email && s.user_name) {
        emailToName.set(s.user_email, s.user_name);
      }
    }

    // If we need names for non-active users, look them up
    const missingEmails = (recentEvents ?? [])
      .map((e) => e.user_email)
      .filter((e): e is string => !!e && !emailToName.has(e));

    if (missingEmails.length > 0) {
      const { data: nameLookup } = await supabase
        .from("analytics_sessions")
        .select("user_email, user_name")
        .in("user_email", [...new Set(missingEmails)])
        .order("started_at", { ascending: false });

      for (const row of nameLookup ?? []) {
        if (row.user_email && row.user_name && !emailToName.has(row.user_email)) {
          emailToName.set(row.user_email, row.user_name);
        }
      }
    }

    const events = (recentEvents ?? []).map((e) => ({
      id: e.id,
      email: e.user_email,
      name: emailToName.get(e.user_email ?? "") ?? e.user_email,
      type: e.event_type,
      eventName: e.event_name,
      path: e.page_path,
      metadata: e.metadata,
      timestamp: e.created_at,
    }));

    return NextResponse.json({ activeUsers, events });
  } catch (err) {
    console.error("[analytics/live] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
