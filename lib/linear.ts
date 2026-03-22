import { LinearClient } from "@linear/sdk";
import { ALL_TEAM_NAMES, orgSlugForTeamName } from "./config";
import type { OrgSlug } from "./types";

// ---------------------------------------------------------------------------
// SDK client — kept for intake route (POST) only
// ---------------------------------------------------------------------------
let client: LinearClient | null = null;

export function getLinearClient(): LinearClient {
  if (!client) {
    const apiKey = process.env.LINEAR_API_KEY;
    if (!apiKey) {
      throw new Error("LINEAR_API_KEY environment variable is not set");
    }
    client = new LinearClient({ apiKey });
  }
  return client;
}

// ---------------------------------------------------------------------------
// GraphQL helper
// ---------------------------------------------------------------------------
export async function linearGraphQL<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) throw new Error("LINEAR_API_KEY environment variable is not set");

  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Linear GraphQL error (${res.status}): ${text}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Linear GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------
const TEAMS_QUERY = `
  query Teams($after: String) {
    teams(after: $after, first: 250) {
      nodes { id name }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const TEAM_PROJECTS_QUERY = `
  query AmplifyTeamProjects($teamId: String!, $after: String) {
    team(id: $teamId) {
      projects(after: $after, first: 50) {
        nodes {
          id
          name
          description
          url
          state
          createdAt
          updatedAt
          startDate
          targetDate
          completedAt
          progress
          health
          status { name color }
          lead { name }
          projectMilestones(first: 25) {
            nodes { id name targetDate sortOrder }
          }
          projectUpdates(first: 20) {
            nodes { id body health createdAt user { id name } }
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Raw types from GraphQL
// ---------------------------------------------------------------------------
export interface RawProject {
  id: string;
  name: string;
  description: string | null;
  url: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  startDate: string | null;
  targetDate: string | null;
  completedAt: string | null;
  progress: number;
  health: string | null;
  status: { name: string; color: string } | null;
  lead: { name: string } | null;
  milestones: { id: string; name: string; targetDate: string | null; sortOrder: number }[];
  updates: { id: string; body: string; health: string | null; createdAt: string; user?: { id: string; name: string } | null }[];
}

export interface AmplifyData {
  teams: { id: string; name: string; orgSlug: OrgSlug }[];
  /** Active projects grouped by org */
  projectsByOrg: Map<OrgSlug, RawProject[]>;
  /** Completed projects grouped by org */
  completedByOrg: Map<OrgSlug, RawProject[]>;
}

// ---------------------------------------------------------------------------
// fetchAmplifyData — single entry point for all read routes
// ---------------------------------------------------------------------------
interface TeamsResponse {
  teams: {
    nodes: { id: string; name: string }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

interface TeamProjectsResponse {
  team: {
    projects: {
      nodes: {
        id: string;
        name: string;
        description: string | null;
        url: string;
        state: string;
        createdAt: string;
        updatedAt: string;
        startDate: string | null;
        targetDate: string | null;
        completedAt: string | null;
        progress: number;
        health: string | null;
        status: { name: string; color: string } | null;
        lead: { name: string } | null;
        projectMilestones: { nodes: { id: string; name: string; targetDate: string | null; sortOrder: number }[] };
        projectUpdates: { nodes: { id: string; body: string; health: string | null; createdAt: string; user?: { id: string; name: string } | null }[] };
      }[];
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  } | null;
}

async function fetchAllProjectsForTeam(teamId: string): Promise<RawProject[]> {
  const allProjects: RawProject[] = [];
  let cursor: string | undefined;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const data = await linearGraphQL<TeamProjectsResponse>(TEAM_PROJECTS_QUERY, {
      teamId,
      after: cursor ?? null,
    });

    if (!data.team) break;
    const page = data.team.projects;

    for (const node of page.nodes) {
      allProjects.push({
        id: node.id,
        name: node.name,
        description: node.description,
        url: node.url,
        state: node.state,
        createdAt: node.createdAt,
        updatedAt: node.updatedAt,
        startDate: node.startDate,
        targetDate: node.targetDate,
        completedAt: node.completedAt,
        progress: node.progress ?? 0,
        health: node.health,
        status: node.status ?? { name: "Unknown", color: "#8b8b9e" },
        lead: node.lead,
        milestones: node.projectMilestones.nodes,
        updates: node.projectUpdates.nodes,
      });
    }

    if (!page.pageInfo.hasNextPage || !page.pageInfo.endCursor) break;
    cursor = page.pageInfo.endCursor;
  }

  return allProjects;
}

export async function fetchAmplifyData(): Promise<AmplifyData> {
  // 1. Fetch all teams (single request)
  const teamsData = await linearGraphQL<TeamsResponse>(TEAMS_QUERY);
  const allTeamNodes = teamsData.teams.nodes;

  // 2. Filter to Amplify teams by name
  const amplifyTeamNodes = allTeamNodes.filter((t) =>
    ALL_TEAM_NAMES.includes(t.name),
  );

  const teams: AmplifyData["teams"] = [];
  for (const t of amplifyTeamNodes) {
    const slug = orgSlugForTeamName(t.name);
    if (slug) teams.push({ id: t.id, name: t.name, orgSlug: slug });
  }

  // 3. Fetch projects for all teams in parallel
  const teamProjectArrays = await Promise.all(
    teams.map((t) => fetchAllProjectsForTeam(t.id)),
  );

  // 4. Deduplicate + group by org
  const seenIds = new Set<string>();
  const projectsByOrg = new Map<OrgSlug, RawProject[]>();
  const completedByOrg = new Map<OrgSlug, RawProject[]>();

  for (let i = 0; i < teams.length; i++) {
    const orgSlug = teams[i].orgSlug;
    for (const project of teamProjectArrays[i]) {
      if (seenIds.has(project.id)) continue;
      seenIds.add(project.id);

      if (project.state === "completed") {
        const arr = completedByOrg.get(orgSlug) ?? [];
        arr.push(project);
        completedByOrg.set(orgSlug, arr);
      } else if (["backlog", "planned", "started", "paused"].includes(project.state)) {
        const arr = projectsByOrg.get(orgSlug) ?? [];
        arr.push(project);
        projectsByOrg.set(orgSlug, arr);
      }
    }
  }

  return { teams, projectsByOrg, completedByOrg };
}
