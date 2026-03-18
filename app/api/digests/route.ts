import { NextRequest, NextResponse } from "next/server";
import { fetchAmplifyData } from "@/lib/linear";
import { ORG_CONFIGS } from "@/lib/config";
import type { DigestEntry, HealthStatus, OrgSlug } from "@/lib/types";

export const revalidate = 1800; // 30 minutes ISR

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

    const data = await fetchAmplifyData();

    const configs = teamFilter
      ? ORG_CONFIGS.filter((c) => c.slug === teamFilter)
      : ORG_CONFIGS;

    const entries: DigestEntry[] = [];

    // Scan both active and completed projects for all updates
    const allOrgProjects = [
      ...Array.from(data.projectsByOrg.entries()),
      ...Array.from(data.completedByOrg.entries()),
    ];

    for (const [orgSlug, projects] of allOrgProjects) {
      const config = configs.find((c) => c.slug === orgSlug);
      if (!config) continue;

      for (const project of projects) {
        for (const update of project.updates) {
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
    }

    entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching digests:", error);
    return NextResponse.json(
      { error: "Failed to fetch digest data" },
      { status: 500 },
    );
  }
}
