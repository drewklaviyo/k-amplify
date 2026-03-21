import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabase();

    // Get all progress entries ordered by date
    const { data: entries, error } = await supabase
      .from("progress")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
    }

    // Get the hours target from config
    const { data: targetConfig } = await supabase
      .from("config")
      .select("value")
      .eq("key", "hours_target")
      .single();

    const target = targetConfig?.value ? Number(targetConfig.value) : 501000;

    // Latest cumulative
    const latest = entries?.[0];
    const currentHours = latest?.cumulative_hours ?? 0;

    return NextResponse.json({
      entries: entries ?? [],
      currentHours,
      target,
      percentage: target > 0 ? Math.round((currentHours / target) * 100) : 0,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminEmail, weekLabel, estimatedHours, note } = body;

    if (!adminEmail || !isAdminEmail(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!weekLabel || estimatedHours == null) {
      return NextResponse.json(
        { error: "weekLabel and estimatedHours are required" },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();

    // Calculate cumulative from all existing entries + new
    const { data: existing } = await supabase
      .from("progress")
      .select("estimated_hours")
      .order("created_at", { ascending: true });

    const previousTotal = (existing ?? []).reduce((sum, e) => sum + e.estimated_hours, 0);
    const cumulative = previousTotal + Number(estimatedHours);

    const { data, error } = await supabase
      .from("progress")
      .insert({
        week_label: weekLabel,
        estimated_hours: Number(estimatedHours),
        cumulative_hours: cumulative,
        note: note || null,
        updated_by: adminEmail,
      })
      .select()
      .single();

    if (error) {
      console.error("Progress insert error:", error);
      return NextResponse.json({ error: "Failed to insert" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, entry: data });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
