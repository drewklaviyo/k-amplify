import { NextRequest, NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";
import { ORG_CONFIGS, ORG_BY_SLUG, orgSlugForTeamName } from "@/lib/config";
import type {
  GoalSummary,
  HealthStatus,
  OrgSlug,
  ProjectSummary,
} from "@/lib/types";

export const revalidate = 300;

function mapHealth(raw: string | undefined | null): HealthStatus {
  if (raw === "onTrack") return "onTrack";
  if (raw === "atRisk") return "atRisk";
  if (raw === "offTrack") return "offTrack";
  return "none";
}

const HEALTH_PRIORITY: Record<HealthStatus, number> = {
  offTrack: 0,
  atRisk: 1,
  onTrack: 2,
  none: 3,
};

function worstHealth(statuses: HealthStatus[]): HealthStatus {
  let worst: HealthStatus = "none";
  for (const s of statuses) {
    if (HEALTH_PRIORITY[s] < HEALTH_PRIORITY[worst]) worst = s;
  }
  return worst;
}

export async function GET(request: NextRequest) {
  try {
    const teamFilter = request.nextUrl.searchParams.get("team") as
      | OrgSlug
      | null;

    const client = getLinearClient();

    // Fetch all teams starting with "Amplify" to build ID -> name mapping
    const teamsResult = await client.teams({
      filter: { name: { startsWith: "Amplify" } },
    });
    const teamMap = new Map<string, string>();
    for (const t of teamsResult.nodes) {
      teamMap.set(t.id, t.name);
    }

    // Fetch active projects — filter in JS since SDK filter types vary by version
    const projectsResult = await client.projects({ first: 250 });

    // Build project summaries
    const projectsByOrg = new Map<OrgSlug, ProjectSummary[]>();

    for (const project of projectsResult.nodes) {
      // Filter by active state types (project.state is a deprecated string field containing the type)
      if (!["planned", "started", "paused"].includes(project.state)) continue;

      const projectTeams = await project.teams();
      const firstTeam = projectTeams.nodes[0];
      if (!firstTeam) continue;

      // Only include Amplify teams
      const teamName = teamMap.get(firstTeam.id) ?? firstTeam.name;
      if (!teamName.startsWith("Amplify")) continue;

      const orgSlug = orgSlugForTeamName(teamName);
      if (!orgSlug) continue;
      if (teamFilter && orgSlug !== teamFilter) continue;

      // Get latest project update
      const updates = await project.projectUpdates({ first: 1 });
      const latestUpdate = updates.nodes[0] ?? null;

      // Get milestones
      const milestonesResult = await project.projectMilestones();
      const milestones = milestonesResult.nodes.map((m) => ({
        id: m.id,
        name: m.name,
        targetDate: m.targetDate ?? null,
        sortOrder: m.sortOrder,
      }));

      const summary: ProjectSummary = {
        id: project.id,
        name: project.name,
        health: mapHealth(latestUpdate?.health),
        teamName,
        orgSlug,
        latestUpdate: latestUpdate?.body ?? null,
        latestUpdateDate: latestUpdate?.createdAt
          ? new Date(latestUpdate.createdAt).toISOString()
          : null,
        milestones,
        completedAt: null,
        updatedAt: new Date(project.updatedAt).toISOString(),
      };

      const existing = projectsByOrg.get(orgSlug) ?? [];
      existing.push(summary);
      projectsByOrg.set(orgSlug, existing);
    }

    // Build GoalSummary objects
    const goals: GoalSummary[] = [];

    const configs = teamFilter
      ? ORG_CONFIGS.filter((c) => c.slug === teamFilter)
      : ORG_CONFIGS;

    for (const config of configs) {
      const projects = projectsByOrg.get(config.slug) ?? [];

      // Sort: At Risk/Off Track first, then by most recently updated
      projects.sort((a, b) => {
        const pa = HEALTH_PRIORITY[a.health];
        const pb = HEALTH_PRIORITY[b.health];
        if (pa !== pb) return pa - pb;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      const goalHealth = worstHealth(projects.map((p) => p.health));

      // Latest update across all projects in this org
      let latestGoalUpdate: string | null = null;
      let latestGoalUpdateDate: string | null = null;
      for (const p of projects) {
        if (
          p.latestUpdateDate &&
          (!latestGoalUpdateDate || p.latestUpdateDate > latestGoalUpdateDate)
        ) {
          latestGoalUpdate = p.latestUpdate;
          latestGoalUpdateDate = p.latestUpdateDate;
        }
      }

      goals.push({
        id: config.slug,
        name: config.goalName,
        health: goalHealth,
        orgSlug: config.slug,
        pmOwner: config.pmOwner,
        latestUpdate: latestGoalUpdate,
        latestUpdateDate: latestGoalUpdateDate,
        projects,
      });
    }

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmap data" },
      { status: 500 }
    );
  }
}
