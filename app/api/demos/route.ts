import { NextRequest, NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";
import { orgSlugForTeamName } from "@/lib/config";
import { extractLoomUrls } from "@/lib/loom";
import type { DemoEntry, OrgSlug } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const teamFilter = request.nextUrl.searchParams.get("team") as
      | OrgSlug
      | null;

    const client = getLinearClient();

    const allTeams = await client.teams({ first: 250 });
    const amplifyTeams = allTeams.nodes.filter((t) =>
      t.name.startsWith("Amplify")
    );

    const entries: DemoEntry[] = [];
    const seenIds = new Set<string>();

    for (const team of amplifyTeams) {
      const orgSlug = orgSlugForTeamName(team.name);
      if (!orgSlug) continue;
      if (teamFilter && orgSlug !== teamFilter) continue;

      const teamProjects = await team.projects({ first: 100 });

      for (const project of teamProjects.nodes) {
        if (seenIds.has(project.id)) continue;
        seenIds.add(project.id);
        if (!["backlog", "planned", "started", "paused", "completed"].includes(project.state))
          continue;

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
    }

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
