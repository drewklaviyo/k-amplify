import { NextRequest, NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";
import { orgSlugForTeamName } from "@/lib/config";
import { extractLoomUrls } from "@/lib/loom";
import type { ShippedEntry, OrgSlug } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const teamFilter = request.nextUrl.searchParams.get("team") as
      | OrgSlug
      | null;

    const client = getLinearClient();

    // Fetch ALL teams and find Amplify ones
    const allTeams = await client.teams({ first: 250 });
    const amplifyTeams = allTeams.nodes.filter((t) =>
      t.name.startsWith("Amplify")
    );

    const entries: ShippedEntry[] = [];
    const seenIds = new Set<string>();

    for (const team of amplifyTeams) {
      const orgSlug = orgSlugForTeamName(team.name);
      if (!orgSlug) continue;
      if (teamFilter && orgSlug !== teamFilter) continue;

      const teamProjects = await team.projects({ first: 100 });

      for (const project of teamProjects.nodes) {
        if (seenIds.has(project.id)) continue;
        seenIds.add(project.id);
        if (project.state !== "completed") continue;

        const updates = await project.projectUpdates({ first: 1 });
        const latestUpdate = updates.nodes[0] ?? null;
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
    }

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
