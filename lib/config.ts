import { OrgConfig, OrgSlug } from "./types";

export const ORG_CONFIGS: OrgConfig[] = [
  {
    slug: "sales",
    label: "Sales",
    teamNames: ["Amplify Sales", "Amplify Demos"],
    goalName: "Increase Seller PPR by 30%",
    pmOwner: "Jay Chiruvolu",
  },
  {
    slug: "support",
    label: "Support",
    teamNames: ["Amplify Support"],
    goalName: "Resolve 55% via automated resolution",
    pmOwner: "Jeremy Blanchard",
  },
  {
    slug: "cs",
    label: "CS/Services",
    teamNames: ["Amplify Success & Services"],
    goalName: "Increase Success & Services time w/ customers by 30%",
    pmOwner: "Tyler Beck",
  },
  {
    slug: "rnd",
    label: "R&D",
    teamNames: ["Amplify R&D"],
    goalName: "Increase R&D efficiency by 13%",
    pmOwner: "Christina Valente",
  },
  {
    slug: "marketing",
    label: "Marketing",
    teamNames: ["Amplify Marketing"],
    goalName: "Improve G&A, Marketing, Ops efficiency by 15%",
    pmOwner: "Richard Ng",
  },
];

export const ORG_BY_SLUG: Record<OrgSlug, OrgConfig> = Object.fromEntries(
  ORG_CONFIGS.map((c) => [c.slug, c])
) as Record<OrgSlug, OrgConfig>;

export const ALL_TEAM_NAMES = ORG_CONFIGS.flatMap((c) => c.teamNames);

export function orgSlugForTeamName(teamName: string): OrgSlug | null {
  const config = ORG_CONFIGS.find((c) => c.teamNames.includes(teamName));
  return config?.slug ?? null;
}

export const INTAKE_REQUEST_TYPES = [
  "New capability",
  "Enhancement to existing",
  "Bug/issue",
  "Data request",
  "Escalation",
] as const;

export const INTAKE_URGENCIES = [
  "Blocking us now",
  "Need this quarter",
  "Future idea",
] as const;
