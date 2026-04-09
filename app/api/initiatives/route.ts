import { NextResponse } from "next/server";
import { linearGraphQL } from "@/lib/linear";
import { INITIATIVE_DETAILS } from "@/lib/config";
import type { InitiativeSlug } from "@/lib/types";

export const revalidate = 300; // 5 minutes

// ---------------------------------------------------------------------------
// GraphQL queries
// ---------------------------------------------------------------------------

const AMPLIFY_MEMBER_IDS_QUERY = `
  query AmplifyMembers {
    teams(filter: { name: { startsWithIgnoreCase: "Amplify" } }) {
      nodes {
        members(first: 50) {
          nodes { id }
        }
      }
    }
  }
`;

const SUB_INITIATIVES_QUERY = `
  query SubInitiatives($id: String!) {
    initiative(id: $id) {
      id
      name
      health
      url
      initiativeUpdates(first: 1, orderBy: createdAt) {
        nodes {
          id body health createdAt
          user { name }
        }
      }
      subInitiatives(first: 30) {
        nodes {
          id name health url status
          owner { id name }
          subInitiatives(first: 20) {
            nodes {
              id name health url status
              owner { id name }
            }
          }
        }
      }
    }
  }
`;

const SUB_INITIATIVE_DETAILS_QUERY = `
  query SubInitiativeDetails($id: String!) {
    initiative(id: $id) {
      id name health url
      documents(first: 5) {
        nodes { id title url }
      }
      initiativeUpdates(first: 1, orderBy: createdAt) {
        nodes {
          id body health createdAt
          user { name }
        }
      }
    }
  }
`;

const SUB_INITIATIVE_DETAILS_WITH_LINKS_QUERY = `
  query SubInitiativeDetailsWithLinks($id: String!) {
    initiative(id: $id) {
      id name health url
      documents(first: 5) {
        nodes { id title url }
      }
      links(first: 5) {
        nodes { id url label }
      }
      initiativeUpdates(first: 1, orderBy: createdAt) {
        nodes {
          id body health createdAt
          user { name }
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AmplifyMembersResponse {
  teams: {
    nodes: {
      members: { nodes: { id: string }[] };
    }[];
  };
}

interface SubInitiativeNode {
  id: string;
  name: string;
  health: string | null;
  url: string;
  status: string | null;
  owner: { id: string; name: string } | null;
  subInitiatives?: {
    nodes: SubInitiativeNode[];
  };
}

interface ParentInitiativeResponse {
  initiative: {
    id: string;
    name: string;
    health: string | null;
    url: string;
    initiativeUpdates: {
      nodes: {
        id: string;
        body: string;
        health: string | null;
        createdAt: string;
        user: { name: string } | null;
      }[];
    };
    subInitiatives: {
      nodes: SubInitiativeNode[];
    };
  } | null;
}

interface SubInitiativeDetailsResponse {
  initiative: {
    id: string;
    name: string;
    health: string | null;
    url: string;
    documents: { nodes: { id: string; title: string; url: string }[] };
    links?: { nodes: { id: string; url: string; label: string | null }[] };
    initiativeUpdates: {
      nodes: {
        id: string;
        body: string;
        health: string | null;
        createdAt: string;
        user: { name: string } | null;
      }[];
    };
  } | null;
}

// ---------------------------------------------------------------------------
// Exported types for the page
// ---------------------------------------------------------------------------

export interface SubInitiativeData {
  id: string;
  name: string;
  owner: string;
  health: string | null;
  url: string;
  documents: { title: string; url: string }[];
  links: { label: string; url: string }[];
  latestUpdate: {
    body: string;
    health: string | null;
    date: string;
    author: string;
  } | null;
  subInitiatives: SubInitiativeChild[];
}

export interface SubInitiativeChild {
  id: string;
  name: string;
  owner: string;
  health: string | null;
  url: string;
  latestUpdate: {
    body: string;
    health: string | null;
    date: string;
    author: string;
  } | null;
}

export interface InitiativeUpdateData {
  slug: InitiativeSlug;
  name: string;
  health: string | null;
  url: string;
  latestUpdate: {
    body: string;
    health: string | null;
    date: string;
    author: string;
  } | null;
  subInitiatives: SubInitiativeData[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchAmplifyMemberIds(): Promise<Set<string>> {
  const data = await linearGraphQL<AmplifyMembersResponse>(AMPLIFY_MEMBER_IDS_QUERY);
  const ids = new Set<string>();
  for (const team of data.teams.nodes) {
    for (const member of team.members.nodes) {
      ids.add(member.id);
    }
  }
  return ids;
}

async function fetchSubInitiativeDetails(
  id: string,
): Promise<SubInitiativeDetailsResponse["initiative"]> {
  // Try with links first, fall back without if it errors
  try {
    const data = await linearGraphQL<SubInitiativeDetailsResponse>(
      SUB_INITIATIVE_DETAILS_WITH_LINKS_QUERY,
      { id },
    );
    return data.initiative;
  } catch {
    // links field might not exist — retry without it
    try {
      const data = await linearGraphQL<SubInitiativeDetailsResponse>(
        SUB_INITIATIVE_DETAILS_QUERY,
        { id },
      );
      return data.initiative;
    } catch {
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    // Step 1: Fetch all Amplify team member IDs
    const amplifyMemberIds = await fetchAmplifyMemberIds();

    const results: InitiativeUpdateData[] = [];

    // Step 2: For each parent initiative, discover Amplify-owned sub-initiatives
    for (const [slug, details] of Object.entries(INITIATIVE_DETAILS)) {
      if (!details.linearInitiativeId) {
        results.push({
          slug: slug as InitiativeSlug,
          name: details.linearInitiative,
          health: null,
          url: details.linearUrl,
          latestUpdate: null,
          subInitiatives: [],
        });
        continue;
      }

      try {
        // Fetch parent initiative + sub-initiatives (2 levels)
        const data = await linearGraphQL<ParentInitiativeResponse>(
          SUB_INITIATIVES_QUERY,
          { id: details.linearInitiativeId },
        );

        const init = data.initiative;
        if (!init) {
          results.push({
            slug: slug as InitiativeSlug,
            name: details.linearInitiative,
            health: null,
            url: details.linearUrl,
            latestUpdate: null,
            subInitiatives: [],
          });
          continue;
        }

        const parentUpdate = init.initiativeUpdates?.nodes?.[0];

        // Filter sub-initiatives to Amplify-owned only
        const amplifySubInits = (init.subInitiatives?.nodes ?? []).filter(
          (sub) => sub.owner?.id && amplifyMemberIds.has(sub.owner.id),
        );

        // Fetch details for each Amplify-owned sub-initiative (in parallel, batched)
        const subInitiativeResults: SubInitiativeData[] = [];

        const detailsPromises = amplifySubInits.map(async (sub) => {
          try {
            const detail = await fetchSubInitiativeDetails(sub.id);

            // Also collect Amplify-owned level-2 sub-initiatives
            const childSubs: SubInitiativeChild[] = [];
            for (const child of sub.subInitiatives?.nodes ?? []) {
              if (child.owner?.id && amplifyMemberIds.has(child.owner.id)) {
                // Fetch latest update for child (lightweight — reuse details query)
                let childUpdate: SubInitiativeChild["latestUpdate"] = null;
                try {
                  const childDetail = await fetchSubInitiativeDetails(child.id);
                  const cu = childDetail?.initiativeUpdates?.nodes?.[0];
                  if (cu) {
                    childUpdate = {
                      body: cu.body,
                      health: cu.health,
                      date: cu.createdAt,
                      author: cu.user?.name ?? "Unknown",
                    };
                  }
                } catch {
                  // skip
                }
                childSubs.push({
                  id: child.id,
                  name: child.name,
                  owner: child.owner?.name ?? "Unknown",
                  health: child.health,
                  url: child.url,
                  latestUpdate: childUpdate,
                });
              }
            }

            const update = detail?.initiativeUpdates?.nodes?.[0];

            return {
              id: sub.id,
              name: detail?.name ?? sub.name,
              owner: sub.owner?.name ?? "Unknown",
              health: detail?.health ?? sub.health,
              url: detail?.url ?? sub.url,
              documents: (detail?.documents?.nodes ?? []).map((d) => ({
                title: d.title,
                url: d.url,
              })),
              links: (detail?.links?.nodes ?? []).map((l) => ({
                label: l.label ?? l.url,
                url: l.url,
              })),
              latestUpdate: update
                ? {
                    body: update.body,
                    health: update.health,
                    date: update.createdAt,
                    author: update.user?.name ?? "Unknown",
                  }
                : null,
              subInitiatives: childSubs,
            } satisfies SubInitiativeData;
          } catch {
            // If fetching details fails, return basic info from parent query
            return {
              id: sub.id,
              name: sub.name,
              owner: sub.owner?.name ?? "Unknown",
              health: sub.health,
              url: sub.url,
              documents: [],
              links: [],
              latestUpdate: null,
              subInitiatives: [],
            } satisfies SubInitiativeData;
          }
        });

        const settled = await Promise.all(detailsPromises);
        subInitiativeResults.push(...settled);

        results.push({
          slug: slug as InitiativeSlug,
          name: init.name ?? details.linearInitiative,
          health: parentUpdate?.health ?? init.health ?? null,
          url: init.url ?? details.linearUrl,
          latestUpdate: parentUpdate
            ? {
                body: parentUpdate.body,
                health: parentUpdate.health,
                date: parentUpdate.createdAt,
                author: parentUpdate.user?.name ?? "Unknown",
              }
            : null,
          subInitiatives: subInitiativeResults,
        });
      } catch {
        results.push({
          slug: slug as InitiativeSlug,
          name: details.linearInitiative,
          health: null,
          url: details.linearUrl,
          latestUpdate: null,
          subInitiatives: [],
        });
      }
    }

    return NextResponse.json({ initiatives: results });
  } catch (error) {
    console.error("Error fetching initiatives:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
