import { NextResponse } from "next/server";
import { fetchAmplifyData } from "@/lib/linear";
import { ORG_CONFIGS } from "@/lib/config";
import { extractLoomUrls } from "@/lib/loom";
import type { HealthStatus, OrgSlug } from "@/lib/types";
import scoreboardData from "@/lib/scoreboard-data.json";

export const revalidate = 300; // 5 minutes ISR

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
    const data = await fetchAmplifyData();

    const now = Date.now();
    const monthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const STALE_DAYS = 14;

    // Per-org aggregation
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

    const HEALTH_PRIORITIES: Record<HealthStatus, number> = {
      offTrack: 0,
      atRisk: 1,
      onTrack: 2,
      none: 3,
    };

    function ensureOrg(slug: string) {
      if (!orgData[slug]) {
        orgData[slug] = {
          health: "none",
          activeProjects: 0,
          shippedProjects: 0,
          missingHealth: 0,
          staleUpdates: 0,
          demosThisMonth: 0,
          shippedMissingDescription: 0,
        };
      }
    }

    // Process active projects
    for (const [orgSlug, projects] of data.projectsByOrg) {
      ensureOrg(orgSlug);
      for (const project of projects) {
        orgData[orgSlug].activeProjects++;

        const latestUpdate = project.updates[0] ?? null;
        const health = mapHealth(latestUpdate?.health);

        if (health === "none") orgData[orgSlug].missingHealth++;

        if (
          !latestUpdate?.createdAt ||
          now - new Date(latestUpdate.createdAt).getTime() >
            STALE_DAYS * 86400000
        ) {
          orgData[orgSlug].staleUpdates++;
        }

        // Count demos this month
        for (const upd of project.updates) {
          if (upd.body && new Date(upd.createdAt) >= monthStart) {
            orgData[orgSlug].demosThisMonth += extractLoomUrls(upd.body).length;
          }
        }

        // Track worst health
        if (HEALTH_PRIORITIES[health] < HEALTH_PRIORITIES[orgData[orgSlug].health]) {
          orgData[orgSlug].health = health;
        }

        // Collect risks
        if (health === "atRisk" || health === "offTrack") {
          const body = latestUpdate?.body ?? "";
          const summary =
            body.length > 150
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

    // Process completed projects
    for (const [orgSlug, projects] of data.completedByOrg) {
      ensureOrg(orgSlug);
      for (const project of projects) {
        orgData[orgSlug].shippedProjects++;
        const lastBody = project.updates[0]?.body ?? "";
        if (!lastBody.trim()) {
          orgData[orgSlug].shippedMissingDescription++;
        }
        for (const upd of project.updates) {
          if (upd.body && new Date(upd.createdAt) >= monthStart) {
            orgData[orgSlug].demosThisMonth += extractLoomUrls(upd.body).length;
          }
        }
      }
    }

    // Sort risks
    risks.sort((a, b) => {
      if (a.health !== b.health) return a.health === "offTrack" ? -1 : 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const orgs = ORG_CONFIGS.map((config) => {
      const linear = orgData[config.slug] ?? {
        health: "none" as HealthStatus,
        activeProjects: 0,
        shippedProjects: 0,
      };
      const snowflake =
        (
          scoreboardData.orgMetrics as Record<
            string,
            (typeof scoreboardData.orgMetrics)["sales"]
          >
        )[config.slug] ?? null;

      return {
        slug: config.slug,
        label: config.label,
        pmOwner: config.pmOwner,
        goalName: config.goalName,
        health: linear.health,
        activeProjects: linear.activeProjects,
        shippedProjects: linear.shippedProjects,
        hoursSaved: snowflake?.hoursSaved ?? 0,
        hoursTarget: snowflake?.hoursTarget ?? 0,
        costPerHour: (snowflake as Record<string, unknown>)?.costPerHour as number ?? 87,
        keyMetricLabel: snowflake?.keyMetricLabel ?? "",
        keyMetricValue: snowflake?.keyMetricValue ?? "",
        keyMetricTarget: snowflake?.keyMetricTarget ?? "",
        adoptionLabel: snowflake?.adoptionLabel ?? "",
        adoptionValue: snowflake?.adoptionValue ?? "",
        adoptionTarget: snowflake?.adoptionTarget ?? "",
      };
    });

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

    // Compute weighted value using per-org cost rates
    const weightedValueM = orgs.reduce((sum, o) => {
      return sum + (o.hoursSaved * o.costPerHour);
    }, 0) / 1_000_000;

    // Compute weighted target value
    const weightedTargetM = orgs.reduce((sum, o) => {
      return sum + (o.hoursTarget * o.costPerHour);
    }, 0) / 1_000_000;

    return NextResponse.json({
      lastUpdated: scoreboardData.lastUpdated,
      topLine: scoreboardData.topLine,
      weightedValueM,
      weightedTargetM,
      orgs,
      risks: risks.slice(0, 5),
      hygiene,
    });
  } catch (error) {
    console.error("Error fetching scoreboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch scoreboard data" },
      { status: 500 },
    );
  }
}
