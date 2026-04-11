import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { linearGraphQL } from "@/lib/linear";
import { ALL_TEAM_NAMES, orgSlugForTeamName } from "@/lib/config";

export const dynamic = "force-dynamic";

const TEAM_MEMBERS_QUERY = `
  query TeamMembers($teamId: String!) {
    team(id: $teamId) {
      members(first: 250) {
        nodes {
          id
          name
          email
          displayName
          avatarUrl
        }
      }
    }
  }
`;

const TEAMS_QUERY = `
  query Teams {
    teams(first: 250) {
      nodes { id name }
    }
  }
`;

interface TeamsResponse {
  teams: { nodes: { id: string; name: string }[] };
}

interface TeamMembersResponse {
  team: {
    members: {
      nodes: {
        id: string;
        name: string;
        email: string | null;
        displayName: string | null;
        avatarUrl: string | null;
      }[];
    };
  } | null;
}

export async function GET(request: NextRequest) { return handleSync(request); }
export async function POST(request: NextRequest) { return handleSync(request); }
async function handleSync(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET; if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Fetch all teams
    const teamsData = await linearGraphQL<TeamsResponse>(TEAMS_QUERY);
    const amplifyTeams = teamsData.teams.nodes.filter((t) =>
      ALL_TEAM_NAMES.includes(t.name),
    );

    let upsertedCount = 0;

    for (const team of amplifyTeams) {
      const orgSlug = orgSlugForTeamName(team.name);
      if (!orgSlug) continue;

      const membersData = await linearGraphQL<TeamMembersResponse>(
        TEAM_MEMBERS_QUERY,
        { teamId: team.id },
      );

      if (!membersData.team) continue;

      for (const member of membersData.team.members.nodes) {
        const { error } = await supabase.from("people").upsert(
          {
            linear_id: member.id,
            name: member.name,
            email: member.email,
            display_name: member.displayName,
            avatar_url: member.avatarUrl,
            org_slug: orgSlug,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "linear_id" },
        );

        if (!error) upsertedCount++;
      }
    }

    return NextResponse.json({ ok: true, upserted: upsertedCount });
  } catch (error) {
    console.error("People sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
