import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("org_metrics")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ metrics: [] });
    }

    // Return as a map keyed by org_slug
    const byOrg: Record<string, { key_metric_value: string; adoption_value: string; updated_at: string }> = {};
    for (const row of data ?? []) {
      byOrg[row.org_slug] = {
        key_metric_value: row.key_metric_value,
        adoption_value: row.adoption_value,
        updated_at: row.updated_at,
      };
    }

    return NextResponse.json({ metrics: byOrg });
  } catch {
    return NextResponse.json({ metrics: {} });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { orgSlug, keyMetricValue, adoptionValue } = body;

    if (!orgSlug) {
      return NextResponse.json({ error: "orgSlug required" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { error } = await supabase
      .from("org_metrics")
      .upsert(
        {
          org_slug: orgSlug,
          key_metric_value: keyMetricValue ?? "",
          adoption_value: adoptionValue ?? "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "org_slug" },
      );

    if (error) {
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
