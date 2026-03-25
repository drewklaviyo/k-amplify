import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabase();

    // Get hours target from config
    const { data: targetConfig } = await supabase
      .from("config")
      .select("value")
      .eq("key", "hours_target")
      .single();

    const target = targetConfig?.value ? Number(targetConfig.value) : 501000;

    // Derive total hours from per-team hours_saved entries
    let currentHours = 0;
    const byOrg: Record<string, number> = {};

    const { data: hoursRows, error } = await supabase
      .from("hours_saved")
      .select("org_slug, hours");

    // If table doesn't exist yet or query fails, just use 0
    if (!error && hoursRows) {
      for (const row of hoursRows) {
        currentHours += row.hours;
        byOrg[row.org_slug] = (byOrg[row.org_slug] ?? 0) + row.hours;
      }
    }

    return NextResponse.json({
      currentHours,
      target,
      percentage: target > 0 ? Math.round((currentHours / target) * 100) : 0,
      byOrg,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    // Return safe defaults so dashboard doesn't break
    return NextResponse.json({
      currentHours: 0,
      target: 501000,
      percentage: 0,
      byOrg: {},
    });
  }
}
