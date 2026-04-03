// =============================================================================
// Portable Analytics — K:Amplify
// Requires: analytics_sessions, analytics_events, analytics_daily tables
// =============================================================================

import { createServerSupabase } from "@/lib/supabase";

/**
 * Compute (or re-compute) the analytics_daily row for today.
 * Called by hourly cron. Upserts — safe to run multiple times.
 */
export async function computeDailyAnalytics(): Promise<{
  date: string;
  sessions: number;
  users: number;
  pageviews: number;
  events: number;
}> {
  const supabase = createServerSupabase();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  // Count sessions today
  const { count: sessionCount } = await supabase
    .from("analytics_sessions")
    .select("id", { count: "exact", head: true })
    .gte("started_at", startOfDay)
    .lte("started_at", endOfDay);

  // Count unique users today
  const { data: userRows } = await supabase
    .from("analytics_sessions")
    .select("user_email")
    .gte("started_at", startOfDay)
    .lte("started_at", endOfDay);
  const uniqueUsers = new Set(
    (userRows ?? []).map((r) => r.user_email).filter(Boolean),
  );

  // Count pageviews today
  const { count: pageviewCount } = await supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "pageview")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  // Count all events today
  const { count: eventCount } = await supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  // Top pages (by pageview count)
  const { data: pageEvents } = await supabase
    .from("analytics_events")
    .select("page_path")
    .eq("event_type", "pageview")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  const pageMap = new Map<string, number>();
  for (const e of pageEvents ?? []) {
    if (e.page_path) {
      pageMap.set(e.page_path, (pageMap.get(e.page_path) ?? 0) + 1);
    }
  }
  const topPages = [...pageMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  // Top features (by event count, excluding pageviews)
  const { data: featureEvents } = await supabase
    .from("analytics_events")
    .select("event_name")
    .neq("event_type", "pageview")
    .gte("created_at", startOfDay)
    .lte("created_at", endOfDay);

  const featureMap = new Map<string, number>();
  for (const e of featureEvents ?? []) {
    featureMap.set(e.event_name, (featureMap.get(e.event_name) ?? 0) + 1);
  }
  const topFeatures = [...featureMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Active users list
  const activeUsers = [...uniqueUsers].map((email) => ({ email }));

  // Upsert daily row
  await supabase.from("analytics_daily").upsert(
    {
      date: today,
      total_sessions: sessionCount ?? 0,
      unique_users: uniqueUsers.size,
      total_pageviews: pageviewCount ?? 0,
      total_events: eventCount ?? 0,
      top_pages: topPages,
      top_features: topFeatures,
      active_users: activeUsers,
      computed_at: new Date().toISOString(),
    },
    { onConflict: "date" },
  );

  return {
    date: today,
    sessions: sessionCount ?? 0,
    users: uniqueUsers.size,
    pageviews: pageviewCount ?? 0,
    events: eventCount ?? 0,
  };
}
