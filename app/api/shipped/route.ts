import { NextRequest, NextResponse } from "next/server";
import { fetchAmplifyData } from "@/lib/linear";
import { extractLoomUrls } from "@/lib/loom";
import type { ShippedEntry, OrgSlug } from "@/lib/types";

export const revalidate = 900; // 15 minutes ISR

export async function GET(request: NextRequest) {
  try {
    const teamFilter = request.nextUrl.searchParams.get("team") as
      | OrgSlug
      | null;

    const data = await fetchAmplifyData();
    const entries: ShippedEntry[] = [];

    for (const [orgSlug, projects] of data.completedByOrg) {
      if (teamFilter && orgSlug !== teamFilter) continue;

      for (const project of projects) {
        const latestUpdate = project.updates[0] ?? null;
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
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching shipped:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipped data" },
      { status: 500 },
    );
  }
}
