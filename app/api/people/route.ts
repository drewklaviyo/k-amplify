import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const search = request.nextUrl.searchParams.get("search");

    let query = supabase
      .from("people")
      .select("*")
      .order("name", { ascending: true });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch people" }, { status: 500 });
    }

    return NextResponse.json({ people: data ?? [] });
  } catch (error) {
    console.error("People fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
