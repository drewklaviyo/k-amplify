import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/server-auth";
import type { HoursSaved } from "@/lib/supabase-types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data: entries, error } = await supabase
      .from("hours_saved")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch hours saved" }, { status: 500 });
    }

    // Compute per-org totals
    const totals: Record<string, number> = {};
    for (const entry of entries ?? []) {
      totals[entry.org_slug] = (totals[entry.org_slug] ?? 0) + entry.hours;
    }

    const grandTotal = Object.values(totals).reduce((sum, h) => sum + h, 0);

    return NextResponse.json({
      entries: entries ?? [],
      totals,
      grandTotal,
    });
  } catch (error) {
    console.error("Error fetching hours saved:", error);
    return NextResponse.json({ error: "Failed to fetch hours saved" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { orgSlug, weekLabel, hours, note } = body;

    if (!orgSlug || !weekLabel || hours == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("hours_saved")
      .upsert(
        {
          org_slug: orgSlug,
          week_label: weekLabel,
          hours: Number(hours),
          note: note || null,
          updated_by: admin.email,
        },
        { onConflict: "org_slug,week_label" },
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving hours:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error("Error in hours-saved POST:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { id, hours, note } = body;

    if (!id || hours == null) {
      return NextResponse.json({ error: "id and hours required" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("hours_saved")
      .update({ hours: Number(hours), note: note ?? null })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in hours-saved PATCH:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase
      .from("hours_saved")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in hours-saved DELETE:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
