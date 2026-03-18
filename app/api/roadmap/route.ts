import { NextRequest, NextResponse } from "next/server";
import { fetchAmplifyData, type RawProject } from "@/lib/linear";
import { ORG_CONFIGS, orgSlugForTeamName, ORG_BY_SLUG } from "@/lib/config";
import { extractLoomUrls } from "@/lib/loom";
import type {
  GoalSummary,
  HealthStatus,
  OrgSlug,
  ProjectSummary,
  ActivityItem,
} from "@/lib/types";

export const revalidate = 300; // 5 minutes ISR

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

function rawToSummary(
  project: RawProject,
  orgSlug: OrgSlug,
  teamName: string,
): ProjectSummary {
  const latestUpdate = project.updates[0] ?? null;
  return {
    id: project.id,
    name: project.name,
    url: project.url ?? null,
    description: project.description ?? null,
    health: mapHealth(latestUpdate?.health),
    teamName,
    orgSlug,
    latestUpdate: latestUpdate?.body ?? null,
    latestUpdateDate: latestUpdate?.createdAt
      ? new Date(latestUpdate.createdAt).toISOString()
      : null,
    milestones: project.milestones.map((m) => ({
      id: m.id,
      name: m.name,
      targetDate: m.targetDate ?? null,
      sortOrder: m.sortOrder,
    })),
    completedAt: project.completedAt
      ? new Date(project.completedAt).toISOString()
      : null,
    updatedAt: new Date(project.updatedAt).toISOString(),
    startDate: project.startDate ?? null,
    targetDate: project.targetDate ?? null,
    progress: project.progress ?? 0,
    status: {
      name: project.status?.name ?? "Unknown",
      color: project.status?.color ?? "#8b8b9e",
    },
    lead: project.lead?.name ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const teamFilter = request.nextUrl.searchParams.get("team") as
      | OrgSlug
      | null;

    const data = await fetchAmplifyData();

    // Build project summaries per org
    const projectsByOrg = new Map<OrgSlug, ProjectSummary[]>();

    for (const team of data.teams) {
      if (teamFilter && team.orgSlug !== teamFilter) continue;
      const orgProjects = data.projectsByOrg.get(team.orgSlug) ?? [];
      for (const project of orgProjects) {
        const existing = projectsByOrg.get(team.orgSlug) ?? [];
        // Avoid duplicate summaries (multiple teams may share org)
        if (existing.some((p) => p.id === project.id)) continue;
        existing.push(rawToSummary(project, team.orgSlug, team.name));
        projectsByOrg.set(team.orgSlug, existing);
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

    // Compute demoCountByOrg (demos this month from all project updates)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const demoCountByOrg: Record<string, number> = {};

    for (const [orgSlug, projects] of data.projectsByOrg) {
      for (const project of projects) {
        for (const update of project.updates) {
          if (update.body && new Date(update.createdAt) >= monthStart) {
            const count = extractLoomUrls(update.body).length;
            if (count > 0) {
              demoCountByOrg[orgSlug] = (demoCountByOrg[orgSlug] ?? 0) + count;
            }
          }
        }
      }
    }
    // Also count demos from completed projects
    for (const [orgSlug, projects] of data.completedByOrg) {
      for (const project of projects) {
        for (const update of project.updates) {
          if (update.body && new Date(update.createdAt) >= monthStart) {
            const count = extractLoomUrls(update.body).length;
            if (count > 0) {
              demoCountByOrg[orgSlug] = (demoCountByOrg[orgSlug] ?? 0) + count;
            }
          }
        }
      }
    }

    // Build recentActivity (last 6 items: shipped + demos)
    const recentActivity: ActivityItem[] = [];

    // Shipped items
    for (const [orgSlug, projects] of data.completedByOrg) {
      for (const project of projects) {
        recentActivity.push({
          type: "shipped",
          title: project.name,
          orgSlug,
          date: project.completedAt
            ? new Date(project.completedAt).toISOString()
            : new Date(project.updatedAt).toISOString(),
          detail: ORG_BY_SLUG[orgSlug]?.label ?? "",
        });
      }
    }

    // Demo items (from active + completed project updates with Loom URLs)
    const allOrgProjects = [
      ...Array.from(data.projectsByOrg.entries()),
      ...Array.from(data.completedByOrg.entries()),
    ];
    for (const [orgSlug, projects] of allOrgProjects) {
      for (const project of projects) {
        for (const update of project.updates) {
          if (!update.body) continue;
          const loomUrls = extractLoomUrls(update.body);
          if (loomUrls.length === 0) continue;
          const updateDate = new Date(update.createdAt);
          const dateFormatted = updateDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          recentActivity.push({
            type: "demo",
            title: `${project.name} — ${dateFormatted}`,
            orgSlug,
            date: updateDate.toISOString(),
            detail: project.name,
          });
        }
      }
    }

    recentActivity.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return NextResponse.json({
      goals,
      demoCountByOrg,
      recentActivity: recentActivity.slice(0, 6),
    });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmap data" },
      { status: 500 },
    );
  }
}
