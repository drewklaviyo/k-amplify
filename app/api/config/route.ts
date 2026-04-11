import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const key = request.nextUrl.searchParams.get("key");

    if (key) {
      const { data, error } = await supabase
        .from("config")
        .select("*")
        .eq("key", key)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Config key not found" }, { status: 404 });
      }
      return NextResponse.json({ config: data });
    }

    const { data, error } = await supabase
      .from("config")
      .select("*");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
    }

    return NextResponse.json({ config: data ?? [] });
  } catch (error) {
    console.error("Config fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value are required" }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from("config")
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Config upsert error:", error);
      return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, config: data });
  } catch (error) {
    console.error("Config update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
