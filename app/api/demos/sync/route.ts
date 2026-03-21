import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { linearGraphQL, fetchAmplifyData } from "@/lib/linear";
import { extractLoomUrls } from "@/lib/loom";

export const dynamic = "force-dynamic";

// Compute the current week's voting period boundaries (Mon 00:00 ET - Fri 09:00 ET)
function getCurrentWeekPeriod() {
  const now = new Date();
  // Get current Monday in ET
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const monday = new Date(et);
  monday.setDate(et.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(9, 0, 0, 0);

  // Format week label
  const monStr = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const friStr = friday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const weekLabel = `${monStr}-${friday.getDate()}, ${friday.getFullYear()}`;

  // Convert back to UTC for storage
  // Use ET offset (approximate — handles DST via the locale trick)
  const opensAt = new Date(monday.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const closesAt = new Date(friday.toLocaleString("en-US", { timeZone: "America/New_York" }));

  return {
    weekLabel: `${monStr}-${friday.getDate()}, ${friday.getFullYear()}`,
    opensAt: monday.toISOString(),
    closesAt: friday.toISOString(),
  };
}

// GraphQL query for issue comments with Loom URLs
const TEAM_ISSUE_COMMENTS_QUERY = `
  query TeamIssueComments($teamId: String!, $after: String, $createdAfter: DateTime) {
    team(id: $teamId) {
      issues(first: 50, after: $after, filter: { updatedAt: { gte: $createdAfter } }) {
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

    // Get last_synced_at from config
    const { data: configRow } = await supabase
      .from("config")
      .select("value")
      .eq("key", "last_synced_at")
      .single();

    const lastSyncedAt = configRow?.value
      ? String(configRow.value).replace(/^"|"$/g, "")
      : "2026-01-01T00:00:00Z";

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
          if (new Date(update.createdAt) < new Date(lastSyncedAt)) continue;

          const loomUrls = extractLoomUrls(update.body);
          for (const url of loomUrls) {
            const dateFormatted = new Date(update.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });

            const { error } = await supabase.from("submissions").upsert(
              {
                loom_url: url,
                title: `${project.name} — ${dateFormatted}`,
                submitter_name: project.lead?.name ?? "Unknown",
                org_slug: orgSlug,
                source_type: "project_update",
                source_id: update.id,
                source_project_name: project.name,
                voting_period_id: votingPeriodId,
                posted_at: update.createdAt,
              },
              { onConflict: "loom_url,source_id", ignoreDuplicates: true },
            );

            if (!error) syncedCount++;
          }
        }
      }
    }

    // Scan issue comments for Loom URLs
    for (const team of data.teams) {
      try {
        const commentsData = await linearGraphQL<IssueCommentsResponse>(
          TEAM_ISSUE_COMMENTS_QUERY,
          { teamId: team.id, createdAfter: lastSyncedAt },
        );

        if (!commentsData.team) continue;

        for (const issue of commentsData.team.issues.nodes) {
          for (const comment of issue.comments.nodes) {
            if (!comment.body) continue;
            if (new Date(comment.createdAt) < new Date(lastSyncedAt)) continue;

            const loomUrls = extractLoomUrls(comment.body);
            for (const url of loomUrls) {
              const dateFormatted = new Date(comment.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

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
                  voting_period_id: votingPeriodId,
                  posted_at: comment.createdAt,
                },
                { onConflict: "loom_url,source_id", ignoreDuplicates: true },
              );

              if (!error) syncedCount++;
            }
          }
        }
      } catch (err) {
        console.error(`Error scanning comments for team ${team.name}:`, err);
      }
    }

    // Update last_synced_at
    await supabase
      .from("config")
      .upsert({ key: "last_synced_at", value: JSON.stringify(new Date().toISOString()), updated_at: new Date().toISOString() });

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
