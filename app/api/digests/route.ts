import { NextRequest, NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";
import { ORG_CONFIGS, orgSlugForTeamName } from "@/lib/config";
import type { DigestEntry, HealthStatus, OrgSlug } from "@/lib/types";

export const revalidate = 1800;

function mapHealth(raw: string | undefined | null): HealthStatus {
  if (raw === "onTrack") return "onTrack";
  if (raw === "atRisk") return "atRisk";
  if (raw === "offTrack") return "offTrack";
  return "none";
}

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

    const configs = teamFilter
      ? ORG_CONFIGS.filter((c) => c.slug === teamFilter)
      : ORG_CONFIGS;

    const entries: DigestEntry[] = [];

    // Fetch projects — filter in JS
    const projectsResult = await client.projects({ first: 250 });

    for (const project of projectsResult.nodes) {
      if (!["planned", "started", "paused", "completed"].includes(project.state)) continue;

      const projectTeams = await project.teams();
      const firstTeam = projectTeams.nodes[0];
      if (!firstTeam) continue;

      const teamName = teamMap.get(firstTeam.id) ?? firstTeam.name;
      if (!teamName.startsWith("Amplify")) continue;

      const orgSlug = orgSlugForTeamName(teamName);
      if (!orgSlug) continue;

      const config = configs.find((c) => c.slug === orgSlug);
      if (!config) continue;

      // Get project updates (up to 12)
      const updates = await project.projectUpdates({ first: 12 });

      for (const update of updates.nodes) {
        const updateDate = new Date(update.createdAt);
        const month = updateDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

        entries.push({
          id: update.id,
          orgSlug,
          goalName: config.goalName,
          health: mapHealth(update.health),
          content: update.body ?? "",
          date: updateDate.toISOString(),
          month,
        });
      }
    }

    // Sort by date descending
    entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching digests:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest data" },
      { status: 500 }
    );
  }
}
