import { OrgConfig, OrgSlug } from "./types";

export const ORG_CONFIGS: OrgConfig[] = [
  {
    slug: "sales",
    label: "Sales",
    teamNames: ["Amplify Sales"],
    goalName: "Increase Seller PPR by 30%",
    pmOwner: "Jay Chiruvolu",
  },
  {
    slug: "demos",
    label: "Demos",
    teamNames: ["Amplify Demos"],
    goalName: "Scale demo delivery & self-service",
    pmOwner: "Jenna Eldredge",
  },
  {
    slug: "support",
    label: "Support",
    teamNames: ["Amplify Support"],
    goalName: "Achieve 70% AI deflection rate in customer support",
    pmOwner: "Jeremy Blanchard",
  },
  {
    slug: "cs",
    label: "CS/Services",
    teamNames: ["Amplify Success & Services"],
    goalName: "Increase CSM time with customers by 30%",
    pmOwner: "Tyler Beck",
  },
  {
    slug: "rnd",
    label: "R&D",
    teamNames: ["Amplify R&D"],
    goalName: "Reduce PM + Design admin toil by 80%",
    pmOwner: "Christina Valente",
  },
  {
    slug: "marketing",
    label: "Marketing",
    teamNames: ["Amplify Marketing", "Amplify Content Platform"],
    goalName: "Achieve <10% dev-dependent content changes",
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
