import { NextResponse } from "next/server";
import { linearGraphQL } from "@/lib/linear";
import { INITIATIVE_DETAILS } from "@/lib/config";
import type { InitiativeSlug } from "@/lib/types";

export const revalidate = 300; // 5 minutes

const INITIATIVE_UPDATES_QUERY = `
  query InitiativeUpdate($id: String!) {
    initiative(id: $id) {
      id
      name
      health
      status
      url
      initiativeUpdates(first: 1, orderBy: createdAt) {
        nodes {
          id
          body
          health
          createdAt
          user { name }
        }
      }
    }
  }
`;

interface InitiativeResponse {
  initiative: {
    id: string;
    name: string;
    health: string | null;
    status: string;
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
}

export async function GET() {
  try {
    const results: InitiativeUpdateData[] = [];

    for (const [slug, details] of Object.entries(INITIATIVE_DETAILS)) {
      if (!details.linearInitiativeId) {
        results.push({
          slug: slug as InitiativeSlug,
          name: details.linearInitiative,
          health: null,
          url: details.linearUrl,
          latestUpdate: null,
        });
        continue;
      }

      try {
        const data = await linearGraphQL<InitiativeResponse>(
          INITIATIVE_UPDATES_QUERY,
          { id: details.linearInitiativeId },
        );

        const init = data.initiative;
        const update = init?.initiativeUpdates?.nodes?.[0];

        results.push({
          slug: slug as InitiativeSlug,
          name: init?.name ?? details.linearInitiative,
          health: update?.health ?? init?.health ?? null,
          url: init?.url ?? details.linearUrl,
          latestUpdate: update
            ? {
                body: update.body,
                health: update.health,
                date: update.createdAt,
                author: update.user?.name ?? "Unknown",
              }
            : null,
        });
      } catch {
        results.push({
          slug: slug as InitiativeSlug,
          name: details.linearInitiative,
          health: null,
          url: details.linearUrl,
          latestUpdate: null,
        });
      }
    }

    return NextResponse.json({ initiatives: results });
  } catch (error) {
    console.error("Error fetching initiatives:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
