import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import type { HoursSaved } from "@/lib/supabase-types";

export const revalidate = 300;

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
    const body = await request.json();
    const { adminEmail, orgSlug, weekLabel, hours, note } = body;

    if (!adminEmail || !orgSlug || !weekLabel || hours == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    // Verify admin
    const { data: config } = await supabase
      .from("config")
      .select("value")
      .eq("key", "admin_emails")
      .single();

    const adminEmails = (config?.value as string[]) ?? [];
    if (!adminEmails.includes(adminEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("hours_saved")
      .upsert(
        {
          org_slug: orgSlug,
          week_label: weekLabel,
          hours: Number(hours),
          note: note || null,
          updated_by: adminEmail,
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
