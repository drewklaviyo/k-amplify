import { NextRequest, NextResponse } from "next/server";
import { getLinearClient } from "@/lib/linear";
import { ORG_BY_SLUG } from "@/lib/config";
import type { IntakeRequest, OrgSlug } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as IntakeRequest;

    // Validate required fields
    const { name, team, requestType, urgency, description } = body;
    if (!name || !team || !requestType || !urgency || !description) {
      return NextResponse.json(
        { error: "All fields are required: name, team, requestType, urgency, description" },
        { status: 400 }
      );
    }

    // Look up org config
    const orgConfig = ORG_BY_SLUG[team as OrgSlug];
    if (!orgConfig) {
      return NextResponse.json(
        { error: `Unknown team: ${team}` },
        { status: 400 }
      );
    }

    const client = getLinearClient();

    // Find the Linear team by name
    const targetTeamName = orgConfig.teamNames[0];
    const teamsResult = await client.teams({
      filter: { name: { eq: targetTeamName } },
    });
    const linearTeam = teamsResult.nodes[0];
    if (!linearTeam) {
      return NextResponse.json(
        { error: `Linear team not found: ${targetTeamName}` },
        { status: 500 }
      );
    }

    // Generate title from first line of description, max 100 chars
    let title = description.split("\n")[0].trim();
    if (!title) {
      title = `Untitled request from ${name}`;
    } else if (title.length > 100) {
      // Truncate at word boundary
      title = title.substring(0, 100);
      const lastSpace = title.lastIndexOf(" ");
      if (lastSpace > 50) {
        title = title.substring(0, lastSpace);
      }
      title += "...";
    }

    // Format description as markdown
    const formattedDescription = [
      `**Submitted by:** ${name}`,
      `**Request type:** ${requestType}`,
      `**Urgency:** ${urgency}`,
      "",
      "---",
      "",
      description,
    ].join("\n");

    // Create the issue
    const issuePayload = await client.createIssue({
      teamId: linearTeam.id,
      title,
      description: formattedDescription,
    });

    const issue = await issuePayload.issue;

    return NextResponse.json({
      success: true,
      teamName: targetTeamName,
      issueId: issue?.id ?? null,
    });
  } catch (error) {
    console.error("Error creating intake issue:", error);
    return NextResponse.json(
      { error: "Failed to create intake request" },
      { status: 500 }
    );
  }
}
