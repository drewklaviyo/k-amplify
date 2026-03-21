import { NextRequest, NextResponse } from "next/server";
import { fetchAmplifyData } from "@/lib/linear";
import { extractLoomUrls } from "@/lib/loom";
import { createServerSupabase } from "@/lib/supabase";
import type { DemoEntry, OrgSlug } from "@/lib/types";
import type { SubmissionWithVotes, Vote } from "@/lib/supabase-types";

export const revalidate = 900; // 15 minutes ISR

export async function GET(request: NextRequest) {
  try {
    const useSupabase = request.nextUrl.searchParams.get("supabase") === "1";

    // New Supabase-backed path for the voting demos page
    if (useSupabase) {
      const supabase = createServerSupabase();
      const periodId = request.nextUrl.searchParams.get("periodId");
      const all = request.nextUrl.searchParams.get("all") === "1";

      let query = supabase.from("submissions").select("*").order("posted_at", { ascending: false });

      if (periodId && !all) {
        query = query.eq("voting_period_id", periodId);
      }

      const { data: subs, error } = await query;

      if (error) {
        return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
      }

      // Get vote counts for these submissions
      const subIds = (subs ?? []).map((s) => s.id);
      const { data: votes } = await supabase
        .from("votes")
        .select("submission_id, category")
        .in("submission_id", subIds.length > 0 ? subIds : ["__none__"]);

      // Aggregate vote counts
      const voteCounts = new Map<string, { builder: number; learner: number }>();
      for (const vote of votes ?? []) {
        const existing = voteCounts.get(vote.submission_id) ?? { builder: 0, learner: 0 };
        if (vote.category === "builder") existing.builder++;
        else existing.learner++;
        voteCounts.set(vote.submission_id, existing);
      }

      const submissions: SubmissionWithVotes[] = (subs ?? []).map((s) => ({
        ...s,
        builder_votes: voteCounts.get(s.id)?.builder ?? 0,
        learner_votes: voteCounts.get(s.id)?.learner ?? 0,
      }));

      return NextResponse.json({ submissions });
    }

    // Original Linear-direct path (for pages that haven't migrated yet)
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
