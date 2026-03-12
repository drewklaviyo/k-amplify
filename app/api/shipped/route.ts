import { NextRequest, NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";
import { orgSlugForTeamName } from "@/lib/config";
import { extractLoomUrls } from "@/lib/loom";
import type { ShippedEntry, OrgSlug } from "@/lib/types";

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

    const entries: ShippedEntry[] = [];

    for (const project of projectsResult.nodes) {
      if (project.state !== "completed") continue;

      const projectTeams = await project.teams();
      const firstTeam = projectTeams.nodes[0];
      if (!firstTeam) continue;

      const teamName = teamMap.get(firstTeam.id) ?? firstTeam.name;
      if (!teamName.startsWith("Amplify")) continue;

      const orgSlug = orgSlugForTeamName(teamName);
      if (!orgSlug) continue;
      if (teamFilter && orgSlug !== teamFilter) continue;

      // Get latest project update
      const updates = await project.projectUpdates({ first: 1 });
      const latestUpdate = updates.nodes[0] ?? null;

      // Extract Loom URLs from the update body
      const loomUrls = latestUpdate?.body
        ? extractLoomUrls(latestUpdate.body)
        : [];

      entries.push({
        id: project.id,
        projectName: project.name,
        orgSlug,
        completedAt: project.completedAt
          ? new Date(project.completedAt).toISOString()
          : new Date(project.updatedAt).toISOString(),
        lastUpdate: latestUpdate?.body ?? "",
        loomUrl: loomUrls[0] ?? null,
      });
    }

    // Sort by completedAt descending
    entries.sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching shipped:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipped data" },
      { status: 500 }
    );
  }
}
