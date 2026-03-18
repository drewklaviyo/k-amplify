import { NextRequest, NextResponse } from "next/server";
import { fetchAmplifyData } from "@/lib/linear";
import { extractLoomUrls } from "@/lib/loom";
import type { DemoEntry, OrgSlug } from "@/lib/types";

export const revalidate = 900; // 15 minutes ISR

export async function GET(request: NextRequest) {
  try {
    const teamFilter = request.nextUrl.searchParams.get("team") as
      | OrgSlug
      | null;

    const data = await fetchAmplifyData();
    const entries: DemoEntry[] = [];

    // Scan both active and completed projects for Loom URLs
    const allOrgProjects = [
      ...Array.from(data.projectsByOrg.entries()),
      ...Array.from(data.completedByOrg.entries()),
    ];

    for (const [orgSlug, projects] of allOrgProjects) {
      if (teamFilter && orgSlug !== teamFilter) continue;

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
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching demos:", error);
    return NextResponse.json(
      { error: "Failed to fetch demo data" },
      { status: 500 },
    );
  }
}
