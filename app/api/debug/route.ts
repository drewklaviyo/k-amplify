import { NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = getLinearClient();
    const projects = await client.projects({ first: 250 });

    // Find all unique states and all Amplify projects
    const states = new Set<string>();
    const amplifyProjects = [];
    for (const p of projects.nodes) {
      states.add(p.state);
      const teams = await p.teams();
      const teamNames = teams.nodes.map((t) => t.name);
      if (teamNames.some((n) => n.startsWith("Amplify"))) {
        amplifyProjects.push({
          name: p.name,
          state: p.state,
          teamNames,
        });
      }
    }

    return NextResponse.json({
      totalProjects: projects.nodes.length,
      allStates: [...states],
      amplifyCount: amplifyProjects.length,
      amplifyProjects,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack?.slice(0, 500) }, { status: 500 });
  }
}
