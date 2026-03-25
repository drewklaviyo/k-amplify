import { NextRequest, NextResponse } from "next/server";
import { fetchAmplifyData } from "@/lib/linear";
import { extractLoomUrls } from "@/lib/loom";
import { ORG_BY_SLUG } from "@/lib/config";
import type { OrgSlug } from "@/lib/types";

export const revalidate = 300;

export interface SearchResult {
  type: "project" | "demo" | "shipped" | "digest";
  title: string;
  subtitle: string;
  orgSlug: OrgSlug;
  href: string;
  loomUrl?: string;
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const data = await fetchAmplifyData();
    const results: SearchResult[] = [];
    const seen = new Set<string>();

    // Search active projects (roadmap)
    for (const [orgSlug, projects] of data.projectsByOrg) {
      for (const project of projects) {
        if (
          project.name.toLowerCase().includes(q) ||
          project.description?.toLowerCase().includes(q)
        ) {
          if (!seen.has(project.id)) {
            seen.add(project.id);
            results.push({
              type: "project",
              title: project.name,
              subtitle: ORG_BY_SLUG[orgSlug]?.label ?? orgSlug,
              orgSlug,
              href: `/roadmap?team=${orgSlug}`,
            });
          }
        }

        // Search Loom demos within project updates
        for (const update of project.updates) {
          if (!update.body) continue;
          const loomUrls = extractLoomUrls(update.body);
          if (loomUrls.length === 0) continue;
          const updateText = `${project.name} ${update.body}`.toLowerCase();
          if (updateText.includes(q)) {
            const key = `demo-${project.id}-${update.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              const date = new Date(update.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              results.push({
                type: "demo",
                title: `${project.name} — ${date}`,
                subtitle: `Loom · ${ORG_BY_SLUG[orgSlug]?.label ?? orgSlug}`,
                orgSlug,
                href: "/demos",
                loomUrl: loomUrls[0],
              });
            }
          }
        }
      }
    }

    // Search completed/shipped projects
    for (const [orgSlug, projects] of data.completedByOrg) {
      for (const project of projects) {
        if (
          project.name.toLowerCase().includes(q) ||
          project.description?.toLowerCase().includes(q)
        ) {
          if (!seen.has(project.id)) {
            seen.add(project.id);
            results.push({
              type: "shipped",
              title: project.name,
              subtitle: `Shipped · ${ORG_BY_SLUG[orgSlug]?.label ?? orgSlug}`,
              orgSlug,
              href: `/shipped?team=${orgSlug}`,
            });
          }
        }

        // Search Loom demos in shipped project updates too
        for (const update of project.updates) {
          if (!update.body) continue;
          const loomUrls = extractLoomUrls(update.body);
          if (loomUrls.length === 0) continue;
          const updateText = `${project.name} ${update.body}`.toLowerCase();
          if (updateText.includes(q)) {
            const key = `demo-${project.id}-${update.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              const date = new Date(update.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              results.push({
                type: "demo",
                title: `${project.name} — ${date}`,
                subtitle: `Loom · ${ORG_BY_SLUG[orgSlug]?.label ?? orgSlug}`,
                orgSlug,
                href: "/demos",
                loomUrl: loomUrls[0],
              });
            }
          }
        }
      }
    }

    // Search digests (project updates as digest content)
    for (const [orgSlug, projects] of [
      ...Array.from(data.projectsByOrg.entries()),
      ...Array.from(data.completedByOrg.entries()),
    ]) {
      for (const project of projects) {
        for (const update of project.updates) {
          if (!update.body) continue;
          const bodyLower = update.body.toLowerCase();
          if (bodyLower.includes(q)) {
            const key = `digest-${update.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              const date = new Date(update.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              results.push({
                type: "digest",
                title: `${project.name} update — ${date}`,
                subtitle: `Digest · ${ORG_BY_SLUG[orgSlug]?.label ?? orgSlug}`,
                orgSlug,
                href: `/digests?team=${orgSlug}`,
              });
            }
          }
        }
      }
    }

    // Limit results
    return NextResponse.json({ results: results.slice(0, 20) });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
