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

    if (tab === "features") {
      // Feature usage ranking
      const { data: featureEvents } = await supabase
        .from("analytics_events")
        .select("event_name, created_at")
        .in("event_type", ["click", "feature"])
        .gte("created_at", since);

      // Aggregate by event_name
      const featureMap = new Map<string, number>();
      for (const e of featureEvents ?? []) {
        featureMap.set(e.event_name, (featureMap.get(e.event_name) ?? 0) + 1);
      }
      const featureRanking = [...featureMap.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      // Daily trend for top 5 features (last 30 days)
      const top5Names = featureRanking.slice(0, 5).map((f) => f.name);
      const { data: dailyFeatures } = await supabase
        .from("analytics_events")
        .select("event_name, created_at")
        .in("event_name", top5Names.length ? top5Names : ["__none__"])
        .gte("created_at", getRangeDate("30d"));

      // Group by date + feature
      const dailyMap = new Map<string, Map<string, number>>();
      for (const e of dailyFeatures ?? []) {
        const date = e.created_at.slice(0, 10);
        if (!dailyMap.has(date)) dailyMap.set(date, new Map());
        const dayMap = dailyMap.get(date)!;
        dayMap.set(e.event_name, (dayMap.get(e.event_name) ?? 0) + 1);
      }
      const featureTrend = [...dailyMap.entries()]
        .map(([date, features]) => ({
          date,
          ...Object.fromEntries(features),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Unused features (zero events in last 7 days)
      const { data: recentFeatures } = await supabase
        .from("analytics_events")
        .select("event_name")
        .in("event_type", ["click", "feature"])
        .gte("created_at", getRangeDate("7d"));

      const recentSet = new Set(
        (recentFeatures ?? []).map((e) => e.event_name),
      );
      const unusedFeatures = featureRanking
        .filter((f) => !recentSet.has(f.name))
        .map((f) => f.name);

      // Feature adoption funnel: count distinct users at each stage
      const { data: funnelEvents } = await supabase
        .from("analytics_events")
        .select("user_email, event_type, event_name, page_path")
        .gte("created_at", since);

      const funnelUsers = new Set<string>();
      const dashboardUsers = new Set<string>();
      const askAiUsers = new Set<string>();
      const generateUsers = new Set<string>();
      const expandUsers = new Set<string>();

      for (const e of funnelEvents ?? []) {
        if (!e.user_email) continue;
        funnelUsers.add(e.user_email);
        if (e.page_path === "/") dashboardUsers.add(e.user_email);
        if (e.page_path === "/chat" || e.event_name === "ask_ai_query")
          askAiUsers.add(e.user_email);
        if (e.event_name === "generate-intelligence")
          generateUsers.add(e.user_email);
        if (e.event_name === "expand-issue")
          expandUsers.add(e.user_email);
      }

      const funnel = [
        { step: "Signed In", users: funnelUsers.size },
        { step: "Viewed Dashboard", users: dashboardUsers.size },
        { step: "Used Ask AI", users: askAiUsers.size },
        { step: "Generated Intelligence", users: generateUsers.size },
        { step: "Expanded Top Issues", users: expandUsers.size },
      ];

      return NextResponse.json({
        featureRanking,
        featureTrend,
        unusedFeatures,
        funnel,
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
