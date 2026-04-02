import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { linearGraphQL, fetchAmplifyData } from "@/lib/linear";
import { extractLoomUrls } from "@/lib/loom";

export const dynamic = "force-dynamic";

// Compute the current week's voting period boundaries
// Week starts Monday 00:00 UTC, closes Friday 13:00 UTC (9:00 AM ET)
function getCurrentWeekPeriod() {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Find this week's Monday (go back to Monday)
  const monday = new Date(now);
  const daysBack = day === 0 ? 6 : day - 1; // Sunday → go back 6, Monday → 0, Tue → 1, etc.
  monday.setUTCDate(now.getUTCDate() - daysBack);
  monday.setUTCHours(0, 0, 0, 0);

  // Friday 20:00 UTC = 4:00 PM ET
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  friday.setUTCHours(20, 0, 0, 0);

  const monStr = monday.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const friStr = friday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

  return {
    weekLabel: `${monStr} - ${friStr}`,
    opensAt: monday.toISOString(),
    closesAt: friday.toISOString(),
  };
}

// GraphQL query for issue comments with Loom URLs
const TEAM_ISSUE_COMMENTS_QUERY = `
  query TeamIssueComments($teamId: String!, $after: String, $updatedAfter: DateTime) {
    team(id: $teamId) {
      issues(first: 50, after: $after, filter: { updatedAt: { gte: $updatedAfter } }) {
        nodes {
          id
          title
          url
          comments(first: 50) {
            nodes {
              id
              body
              createdAt
              user { id name }
            }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

interface IssueCommentsResponse {
  team: {
    issues: {
      nodes: {
        id: string;
        title: string;
        url: string;
        comments: {
          nodes: {
            id: string;
            body: string;
            createdAt: string;
            user: { id: string; name: string } | null;
          }[];
        };
      }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Ensure a voting period exists for the current week
    const period = getCurrentWeekPeriod();
    const { data: existingPeriod } = await supabase
      .from("voting_periods")
      .select("id")
      .eq("week_label", period.weekLabel)
      .single();

    let votingPeriodId: string;
    if (existingPeriod) {
      votingPeriodId = existingPeriod.id;
    } else {
      const { data: newPeriod, error: periodError } = await supabase
        .from("voting_periods")
        .insert({
          week_label: period.weekLabel,
          opens_at: period.opensAt,
          closes_at: period.closesAt,
          status: "open",
        })
        .select("id")
        .single();

      if (periodError) {
        console.error("Error creating voting period:", periodError);
        return NextResponse.json({ error: "Failed to create voting period" }, { status: 500 });
      }
      votingPeriodId = newPeriod.id;
    }

    // Fetch Amplify data (project updates with Loom URLs)
    const data = await fetchAmplifyData();
    let syncedCount = 0;

    // Scan project updates for Loom URLs
    const allOrgProjects = [
      ...Array.from(data.projectsByOrg.entries()),
      ...Array.from(data.completedByOrg.entries()),
    ];

    for (const [orgSlug, projects] of allOrgProjects) {
      for (const project of projects) {
        for (const update of project.updates) {
          if (!update.body) continue;
          const loomUrls = extractLoomUrls(update.body);
          for (const url of loomUrls) {
            const dateFormatted = new Date(update.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            // Only assign to current voting period if posted this week
            const postedAt = new Date(update.createdAt);
            const periodStart = new Date(period.opensAt);
            const periodEnd = new Date(period.closesAt);
            const isThisWeek = postedAt >= periodStart && postedAt <= periodEnd;

            const { error } = await supabase.from("submissions").upsert(
              {
                loom_url: url,
                title: `${project.name} — ${dateFormatted}`,
                submitter_name: update.user?.name ?? project.lead?.name ?? "Unknown",
                org_slug: orgSlug,
                source_type: "project_update",
                source_id: update.id,
                source_project_name: project.name,
                source_url: project.url ?? null,
                voting_period_id: isThisWeek ? votingPeriodId : null,
                posted_at: update.createdAt,
              },
              { onConflict: "loom_url,source_id" },
            );

            if (!error) syncedCount++;
          }
        }
      }
    }

    // Scan project external links (Resources) for Loom URLs
    for (const [orgSlug, projects] of allOrgProjects) {
      for (const project of projects) {
        for (const link of project.externalLinks ?? []) {
          if (!link.url) continue;
          const loomUrls = extractLoomUrls(link.url);
          for (const url of loomUrls) {
            const postedAt = new Date(link.createdAt);
            const periodStart = new Date(period.opensAt);
            const periodEnd = new Date(period.closesAt);
            const isThisWeek = postedAt >= periodStart && postedAt <= periodEnd;

            const { error } = await supabase.from("submissions").upsert(
              {
                loom_url: url,
                title: link.label ? `${project.name} — ${link.label}` : project.name,
                submitter_name: project.lead?.name ?? "Unknown",
                org_slug: orgSlug,
                source_type: "project_update",
                source_id: link.id,
                source_project_name: project.name,
                source_url: project.url ?? null,
                voting_period_id: isThisWeek ? votingPeriodId : null,
                posted_at: link.createdAt,
              },
              { onConflict: "loom_url,source_id" },
            );

            if (!error) syncedCount++;
          }
        }
      }
    }

    // Scan issue comments for Loom URLs (paginated, last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    for (const team of data.teams) {
      try {
        let cursor: string | null = null;
        let hasMore = true;

        while (hasMore) {
        const commentsData: IssueCommentsResponse = await linearGraphQL<IssueCommentsResponse>(
          TEAM_ISSUE_COMMENTS_QUERY,
          { teamId: team.id, after: cursor, updatedAfter: thirtyDaysAgo },
        );

        if (!commentsData.team) break;

        for (const issue of commentsData.team.issues.nodes) {
          for (const comment of issue.comments.nodes) {
            if (!comment.body) continue;

            const loomUrls = extractLoomUrls(comment.body);
            for (const url of loomUrls) {
              const dateFormatted = new Date(comment.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              // Only assign to current voting period if posted this week
              const commentPostedAt = new Date(comment.createdAt);
              const periodStart = new Date(period.opensAt);
              const periodEnd = new Date(period.closesAt);
              const isThisWeek = commentPostedAt >= periodStart && commentPostedAt <= periodEnd;

              const { error } = await supabase.from("submissions").upsert(
                {
                  loom_url: url,
                  title: `${issue.title} — ${dateFormatted}`,
                  submitter_name: comment.user?.name ?? "Unknown",
                  submitter_linear_id: comment.user?.id ?? null,
                  org_slug: team.orgSlug,
                  source_type: "issue_comment",
                  source_id: comment.id,
                  source_project_name: issue.title,
                  source_url: issue.url ?? null,
                  voting_period_id: isThisWeek ? votingPeriodId : null,
                  posted_at: comment.createdAt,
                },
                { onConflict: "loom_url,source_id" },
              );

              if (!error) syncedCount++;
            }
          }
        }

        // Paginate
        hasMore = commentsData.team.issues.pageInfo.hasNextPage;
        cursor = commentsData.team.issues.pageInfo.endCursor;
        }
      } catch (err) {
        console.error(`Error scanning comments for team ${team.name}:`, err);
      }
    }

    return NextResponse.json({
      ok: true,
      synced: syncedCount,
      votingPeriodId,
      weekLabel: period.weekLabel,
    });
  } catch (error) {
    console.error("Demo sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
