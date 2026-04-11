// =============================================================================
// Portable Analytics — K:Amplify
// Requires: analytics_sessions, analytics_events, analytics_daily tables
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const maxDuration = 15;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const range = searchParams.get("range") ?? "7d";
    const tab = searchParams.get("tab") ?? "users";

    const supabase = createServerSupabase();
    const since = getRangeDate(range);

    if (tab === "users") {
      // DAU / WAU / MAU
      const [dau, wau, mau] = await Promise.all([
        countUniqueUsers(supabase, getRangeDate("1d")),
        countUniqueUsers(supabase, getRangeDate("7d")),
        countUniqueUsers(supabase, getRangeDate("30d")),
      ]);

      // Prior period for trend arrows
      const [dauPrev, wauPrev, mauPrev] = await Promise.all([
        countUniqueUsers(supabase, getRangeDate("2d"), getRangeDate("1d")),
        countUniqueUsers(supabase, getRangeDate("14d"), getRangeDate("7d")),
        countUniqueUsers(supabase, getRangeDate("60d"), getRangeDate("30d")),
      ]);

      // User table: all users with activity summary
      const { data: users } = await supabase
        .from("analytics_sessions")
        .select("user_email, user_name, started_at, page_count")
        .gte("started_at", since)
        .order("started_at", { ascending: false });

      // Aggregate per user
      const userMap = new Map<string, {
        email: string;
        name: string;
        lastActive: string;
        sessions: number;
        pageviews: number;
      }>();

      for (const row of users ?? []) {
        const key = row.user_email ?? "unknown";
        const existing = userMap.get(key);
        if (existing) {
          existing.sessions += 1;
          existing.pageviews += row.page_count ?? 0;
          if (row.started_at > existing.lastActive) {
            existing.lastActive = row.started_at;
          }
        } else {
          userMap.set(key, {
            email: key,
            name: row.user_name ?? key,
            lastActive: row.started_at,
            sessions: 1,
            pageviews: row.page_count ?? 0,
          });
        }
      }

      // Get event counts per user
      const { data: eventCounts } = await supabase
        .from("analytics_events")
        .select("user_email, event_name")
        .gte("created_at", since)
        .neq("event_type", "pageview");

      // Count events and find top feature per user
      const userEventMap = new Map<string, {
        count: number;
        features: Map<string, number>;
      }>();
      for (const e of eventCounts ?? []) {
        const key = e.user_email ?? "unknown";
        const entry = userEventMap.get(key) ?? { count: 0, features: new Map() };
        entry.count += 1;
        entry.features.set(
          e.event_name,
          (entry.features.get(e.event_name) ?? 0) + 1,
        );
        userEventMap.set(key, entry);
      }

      const userList = Array.from(userMap.values()).map((u) => {
        const events = userEventMap.get(u.email);
        let topFeature = "\u2014";
        if (events?.features.size) {
          topFeature = [...events.features.entries()].sort(
            (a, b) => b[1] - a[1],
          )[0][0];
        }
        return {
          ...u,
          events: events?.count ?? 0,
          topFeature,
        };
      });

      return NextResponse.json({
        dau,
        wau,
        mau,
        dauPrev,
        wauPrev,
        mauPrev,
        users: userList,
      });
    }

    if (tab === "pages") {
      // Page views breakdown by path
      const { data: pageEvents } = await supabase
        .from("analytics_events")
        .select("page_path, created_at")
        .eq("event_type", "pageview")
        .gte("created_at", since);

      // Aggregate by page path
      const pageMap = new Map<string, number>();
      for (const e of pageEvents ?? []) {
        const path = e.page_path ?? "/";
        pageMap.set(path, (pageMap.get(path) ?? 0) + 1);
      }
      const pageRanking = [...pageMap.entries()]
        .map(([path, count]) => ({ name: path, count }))
        .sort((a, b) => b.count - a.count);

      // Daily page view trend (last 30 days)
      const { data: dailyPages } = await supabase
        .from("analytics_events")
        .select("created_at")
        .eq("event_type", "pageview")
        .gte("created_at", getRangeDate("30d"));

      const dailyMap = new Map<string, number>();
      for (const e of dailyPages ?? []) {
        const date = e.created_at.slice(0, 10);
        dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
      }
      const pageTrend = [...dailyMap.entries()]
        .map(([date, count]) => ({ date, views: count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const totalPageviews = (pageEvents ?? []).length;

      return NextResponse.json({
        featureRanking: pageRanking,
        featureTrend: pageTrend,
        totalPageviews,
        unusedFeatures: [],
        funnel: [],
      });
    }

    return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
  } catch (err) {
    console.error("[analytics/stats] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRangeDate(range: string): string {
  const now = new Date();
  const days = parseInt(range) || 7;
  now.setDate(now.getDate() - days);
  return now.toISOString();
}

async function countUniqueUsers(
  supabase: ReturnType<typeof createServerSupabase>,
  since: string,
  until?: string,
): Promise<number> {
  let query = supabase
    .from("analytics_sessions")
    .select("user_email")
    .gte("started_at", since);

  if (until) {
    query = query.lt("started_at", until);
  }

  const { data } = await query;
  const unique = new Set((data ?? []).map((r) => r.user_email));
  unique.delete(null);
  return unique.size;
}
