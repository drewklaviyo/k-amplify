// =============================================================================
// Portable Analytics — K:Amplify
// Requires: analytics_sessions, analytics_events, analytics_daily tables
// =============================================================================

import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const maxDuration = 10;

/**
 * PUT — Upsert a session. Returns { sessionId }.
 *
 * Body: { sessionHash, userEmail, userName, browser, os, device, screen }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionHash, userEmail, userName, browser, os, device, screen } =
      body;

    if (!sessionHash) {
      return NextResponse.json(
        { error: "sessionHash required" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("analytics_sessions")
      .upsert(
        {
          session_hash: sessionHash,
          user_email: userEmail ?? null,
          user_name: userName ?? null,
          browser: browser ?? null,
          os: os ?? null,
          device: device ?? null,
          screen: screen ?? null,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: "session_hash" },
      )
      .select("id")
      .single();

    if (error) {
      console.error("[analytics/collect] session upsert error:", error);
      return NextResponse.json(
        { error: "Session upsert failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ sessionId: data.id });
  } catch (err) {
    console.error("[analytics/collect] PUT error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * POST — Batch-insert events and update session activity.
 *
 * Body: { sessionId, events: [{ type, name, path, title?, referrer?, metadata?, ts }] }
 * Also accepts navigator.sendBeacon (Content-Type may be text/plain).
 */
export async function POST(request: NextRequest) {
  try {
    let body: { sessionId: string; events: Array<Record<string, unknown>> };

    // sendBeacon may send as text/plain
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("text/plain")) {
      const text = await request.text();
      body = JSON.parse(text);
    } else {
      body = await request.json();
    }

    const { sessionId, events } = body;

    if (!sessionId || !events?.length) {
      return NextResponse.json(
        { error: "sessionId and events required" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();

    // Count pageviews in this batch
    const pageviewCount = events.filter(
      (e) => e.type === "pageview",
    ).length;

    // Batch insert events
    const rows = events.map((e) => ({
      session_id: sessionId,
      user_email: null as string | null, // filled from session below
      event_type: e.type as string,
      event_name: e.name as string,
      page_path: (e.path as string) ?? null,
      page_title: (e.title as string) ?? null,
      referrer: (e.referrer as string) ?? null,
      metadata: (e.metadata as Record<string, unknown>) ?? {},
      created_at: new Date(e.ts as number).toISOString(),
    }));

    // Get session email for denormalization
    const { data: sessionData } = await supabase
      .from("analytics_sessions")
      .select("user_email")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionData?.user_email) {
      rows.forEach((r) => (r.user_email = sessionData.user_email));
    }

    const { error: insertError } = await supabase
      .from("analytics_events")
      .insert(rows);

    if (insertError) {
      console.error("[analytics/collect] event insert error:", insertError);
      return NextResponse.json(
        { error: "Event insert failed" },
        { status: 500 },
      );
    }

    // Update session last_active_at and page_count
    if (pageviewCount > 0) {
      // Use raw SQL to atomically increment page_count
      await supabase.rpc("increment_analytics_page_count", {
        p_session_id: sessionId,
        p_increment: pageviewCount,
      });
    } else {
      await supabase
        .from("analytics_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", sessionId);
    }

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (err) {
    console.error("[analytics/collect] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
