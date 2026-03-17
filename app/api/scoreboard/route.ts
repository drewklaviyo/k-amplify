import { NextRequest, NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";
import { ORG_CONFIGS, orgSlugForTeamName } from "@/lib/config";
import { extractLoomUrls } from "@/lib/loom";
import type { HealthStatus, OrgSlug } from "@/lib/types";
import scoreboardData from "@/lib/scoreboard-data.json";

export const dynamic = "force-dynamic";

function mapHealth(raw: string | undefined | null): HealthStatus {
  if (raw === "onTrack") return "onTrack";
  if (raw === "atRisk") return "atRisk";
  if (raw === "offTrack") return "offTrack";
  return "none";
}

interface RiskItem {
  projectName: string;
  orgSlug: OrgSlug;
  health: HealthStatus;
  summary: string;
  date: string;
}

interface HygieneStats {
  slug: OrgSlug;
  label: string;
  pmOwner: string;
  totalProjects: number;
  missingHealth: number;
  staleUpdates: number;
  demosThisMonth: number;
  shippedMissingDescription: number;
}

export async function GET() {
  try {
    const client = getLinearClient();

    // Fetch Amplify teams
    const allTeams = await client.teams({ first: 250 });
    const amplifyTeams = allTeams.nodes.filter((t) =>
      t.name.startsWith("Amplify")
    );

    // Per-org Linear data
    const orgData: Record<
      string,
      {
        health: HealthStatus;
        activeProjects: number;
        shippedProjects: number;
        missingHealth: number;
        staleUpdates: number;
        demosThisMonth: number;
        shippedMissingDescription: number;
      }
    > = {};
    const risks: RiskItem[] = [];
    const seenIds = new Set<string>();
    const now = Date.now();
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const STALE_DAYS = 14;

    for (const team of amplifyTeams) {
      const orgSlug = orgSlugForTeamName(team.name);
      if (!orgSlug) continue;

      if (!orgData[orgSlug]) {
        orgData[orgSlug] = {
          health: "none",
          activeProjects: 0,
          shippedProjects: 0,
          missingHealth: 0,
          staleUpdates: 0,
          demosThisMonth: 0,
          shippedMissingDescription: 0,
        };
      }

      const teamProjects = await team.projects({ first: 100 });

      for (const project of teamProjects.nodes) {
        if (seenIds.has(project.id)) continue;
        seenIds.add(project.id);

        if (project.state === "completed") {
          orgData[orgSlug].shippedProjects++;
          // Check if shipped project has a description
          const completedUpdates = await project.projectUpdates({ first: 1 });
          const lastBody = completedUpdates.nodes[0]?.body ?? "";
          if (!lastBody.trim()) {
            orgData[orgSlug].shippedMissingDescription++;
          }
          // Check for demos on completed projects too
          for (const upd of completedUpdates.nodes) {
            if (upd.body && new Date(upd.createdAt) >= monthStart) {
              orgData[orgSlug].demosThisMonth += extractLoomUrls(upd.body).length;
            }
          }
          continue;
        }

        if (!["backlog", "planned", "started", "paused"].includes(project.state))
          continue;

        orgData[orgSlug].activeProjects++;

        // Get latest update for health and risk detection
        const updates = await project.projectUpdates({ first: 5 });
        const latestUpdate = updates.nodes[0] ?? null;
        const health = mapHealth(latestUpdate?.health);

        // Hygiene: missing health
        if (health === "none") {
          orgData[orgSlug].missingHealth++;
        }

        // Hygiene: stale updates (no update or last update > 14 days ago)
        if (!latestUpdate?.createdAt || (now - new Date(latestUpdate.createdAt).getTime()) > STALE_DAYS * 86400000) {
          orgData[orgSlug].staleUpdates++;
        }

        // Hygiene: count demos this month from recent updates
        for (const upd of updates.nodes) {
          if (upd.body && new Date(upd.createdAt) >= monthStart) {
            orgData[orgSlug].demosThisMonth += extractLoomUrls(upd.body).length;
          }
        }

        // Track worst health per org
        const priorities: Record<HealthStatus, number> = {
          offTrack: 0,
          atRisk: 1,
          onTrack: 2,
          none: 3,
        };
        if (priorities[health] < priorities[orgData[orgSlug].health]) {
          orgData[orgSlug].health = health;
        }

        // Collect risks
        if (health === "atRisk" || health === "offTrack") {
          const body = latestUpdate?.body ?? "";
          // Extract first 150 chars as summary
          const summary = body.length > 150
            ? body.substring(0, 150).replace(/\s\S*$/, "").trim() + "..."
            : body;

          risks.push({
            projectName: project.name,
            orgSlug,
            health,
            summary,
            date: latestUpdate?.createdAt
              ? new Date(latestUpdate.createdAt).toISOString()
              : new Date(project.updatedAt).toISOString(),
          });
        }
      }
    }

    // Sort risks: offTrack first, then by date
    risks.sort((a, b) => {
      if (a.health !== b.health) {
        return a.health === "offTrack" ? -1 : 1;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Build response combining Linear data + Snowflake data (from JSON for now)
    const orgs = ORG_CONFIGS.map((config) => {
      const linear = orgData[config.slug] ?? {
        health: "none" as HealthStatus,
        activeProjects: 0,
        shippedProjects: 0,
      };
      const snowflake =
        (scoreboardData.orgMetrics as Record<string, typeof scoreboardData.orgMetrics.sales>)[config.slug] ?? null;

      return {
        slug: config.slug,
        label: config.label,
        pmOwner: config.pmOwner,
        goalName: config.goalName,
        // From Linear
        health: linear.health,
        activeProjects: linear.activeProjects,
        shippedProjects: linear.shippedProjects,
        // From Snowflake (JSON placeholder)
        hoursSaved: snowflake?.hoursSaved ?? 0,
        hoursTarget: snowflake?.hoursTarget ?? 0,
        keyMetricLabel: snowflake?.keyMetricLabel ?? "",
        keyMetricValue: snowflake?.keyMetricValue ?? "",
        keyMetricTarget: snowflake?.keyMetricTarget ?? "",
        adoptionLabel: snowflake?.adoptionLabel ?? "",
        adoptionValue: snowflake?.adoptionValue ?? "",
        adoptionTarget: snowflake?.adoptionTarget ?? "",
      };
    });

    // Build hygiene stats
    const hygiene: HygieneStats[] = ORG_CONFIGS.map((config) => {
      const d = orgData[config.slug];
      return {
        slug: config.slug,
        label: config.label,
        pmOwner: config.pmOwner,
        totalProjects: d ? d.activeProjects : 0,
        missingHealth: d?.missingHealth ?? 0,
        staleUpdates: d?.staleUpdates ?? 0,
        demosThisMonth: d?.demosThisMonth ?? 0,
        shippedMissingDescription: d?.shippedMissingDescription ?? 0,
      };
    });

    return NextResponse.json({
      lastUpdated: scoreboardData.lastUpdated,
      topLine: scoreboardData.topLine,
      orgs,
      risks: risks.slice(0, 5),
      hygiene,
    });
  } catch (error) {
    console.error("Error fetching scoreboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch scoreboard data" },
      { status: 500 }
    );
  }
}
