import { NextRequest, NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";
import { ORG_CONFIGS, orgSlugForTeamName } from "@/lib/config";
import type {
  GoalSummary,
  HealthStatus,
  OrgSlug,
  ProjectSummary,
} from "@/lib/types";

export const dynamic = "force-dynamic";

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

    // Fetch ALL teams and find Amplify ones by name
    const allTeams = await client.teams({ first: 250 });
    const amplifyTeams = allTeams.nodes.filter(
      (t) => t.name.startsWith("Amplify")
    );

    // Build project summaries by fetching projects per team
    const projectsByOrg = new Map<OrgSlug, ProjectSummary[]>();
    const seenProjectIds = new Set<string>();

    for (const team of amplifyTeams) {
      const orgSlug = orgSlugForTeamName(team.name);
      if (!orgSlug) continue;
      if (teamFilter && orgSlug !== teamFilter) continue;

      // Fetch projects for this team
      const teamProjects = await team.projects({ first: 100 });

      for (const project of teamProjects.nodes) {
        // Skip duplicates (project may belong to multiple teams)
        if (seenProjectIds.has(project.id)) continue;
        seenProjectIds.add(project.id);

        // Only active states
        if (!["backlog", "planned", "started", "paused"].includes(project.state))
          continue;

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

        // Get project lead
        const lead = await project.lead;

        // Get status info
        const statusInfo = await project.status;

        const summary: ProjectSummary = {
          id: project.id,
          name: project.name,
          health: mapHealth(latestUpdate?.health),
          teamName: team.name,
          orgSlug,
          latestUpdate: latestUpdate?.body ?? null,
          latestUpdateDate: latestUpdate?.createdAt
            ? new Date(latestUpdate.createdAt).toISOString()
            : null,
          milestones,
          completedAt: null,
          updatedAt: new Date(project.updatedAt).toISOString(),
          startDate: project.startDate ?? null,
          targetDate: project.targetDate ?? null,
          progress: project.progress ?? 0,
          status: {
            name: statusInfo?.name ?? "Unknown",
            color: statusInfo?.color ?? "#8b8b9e",
          },
          lead: lead?.name ?? null,
        };

        const existing = projectsByOrg.get(orgSlug) ?? [];
        existing.push(summary);
        projectsByOrg.set(orgSlug, existing);
      }
    }

    // Build GoalSummary objects
    const goals: GoalSummary[] = [];

    const configs = teamFilter
      ? ORG_CONFIGS.filter((c) => c.slug === teamFilter)
      : ORG_CONFIGS;

    for (const config of configs) {
      const projects = projectsByOrg.get(config.slug) ?? [];

      projects.sort((a, b) => {
        const pa = HEALTH_PRIORITY[a.health];
        const pb = HEALTH_PRIORITY[b.health];
        if (pa !== pb) return pa - pb;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });

      const goalHealth = worstHealth(projects.map((p) => p.health));

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
