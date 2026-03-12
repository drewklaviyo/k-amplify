import { NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getLinearClient();
    const projects = await client.projects({ first: 10 });

    const debug = [];
    for (const p of projects.nodes) {
      const teams = await p.teams();
      const teamNames = teams.nodes.map((t) => t.name);
      debug.push({
        name: p.name,
        state: p.state,
        status: (p as any).status,
        health: (p as any).health,
        teamNames,
        keys: Object.keys(p).filter(k => !k.startsWith('_')).slice(0, 20),
      });
    }

    return NextResponse.json({ count: projects.nodes.length, projects: debug });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
}
