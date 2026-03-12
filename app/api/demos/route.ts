import { NextRequest, NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";
import { orgSlugForTeamName } from "@/lib/config";
import { extractLoomUrls } from "@/lib/loom";
import type { DemoEntry, OrgSlug } from "@/lib/types";

export const revalidate = 900;

export async function GET(request: NextRequest) {
  try {
    const teamFilter = request.nextUrl.searchParams.get("team") as
      | OrgSlug
      | null;

    const client = getLinearClient();

    // Fetch teams starting with "Amplify"
    const teamsResult = await client.teams({
      filter: { name: { startsWith: "Amplify" } },
    });
    const teamMap = new Map<string, string>();
    for (const t of teamsResult.nodes) {
      teamMap.set(t.id, t.name);
    }

    // Fetch projects — filter in JS
    const projectsResult = await client.projects({ first: 250 });

    const entries: DemoEntry[] = [];

    for (const project of projectsResult.nodes) {
      if (!["planned", "started", "paused", "completed"].includes(project.state)) continue;

      const projectTeams = await project.teams();
      const firstTeam = projectTeams.nodes[0];
      if (!firstTeam) continue;

      const teamName = teamMap.get(firstTeam.id) ?? firstTeam.name;
      if (!teamName.startsWith("Amplify")) continue;

      const orgSlug = orgSlugForTeamName(teamName);
      if (!orgSlug) continue;
      if (teamFilter && orgSlug !== teamFilter) continue;

      // Fetch up to 20 project updates
      const updates = await project.projectUpdates({ first: 20 });

      for (const update of updates.nodes) {
        if (!update.body) continue;

        const loomUrls = extractLoomUrls(update.body);
        if (loomUrls.length === 0) continue;

        const updateDate = new Date(update.createdAt);
        const dateFormatted = updateDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        for (const url of loomUrls) {
          entries.push({
            id: `${update.id}-${url}`,
            loomUrl: url,
            title: `${project.name} — ${dateFormatted}`,
            orgSlug,
            projectName: project.name,
            date: updateDate.toISOString(),
          });
        }
      }
    }

    // Sort by date descending
    entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching demos:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo data" },
      { status: 500 }
    );
  }
}
