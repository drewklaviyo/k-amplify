import { OrgConfig, OrgSlug, InitiativeTag, InitiativeSlug } from "./types";

export const INITIATIVES: Record<InitiativeSlug, InitiativeTag> = {
  waif: {
    slug: "waif",
    name: "Working AI First",
    color: "#E67E22",
    colorVar: "var(--color-accent)",
  },
  enterprise: {
    slug: "enterprise",
    name: "Enterprise",
    color: "#74b9ff",
    colorVar: "var(--color-blue)",
  },
  growth: {
    slug: "growth",
    name: "Growth",
    color: "#00b894",
    colorVar: "var(--color-green)",
  },
};

export const INITIATIVE_LIST: InitiativeTag[] = Object.values(INITIATIVES);

export const INITIATIVE_DETAILS: Record<
  InitiativeSlug,
  {
    goal: string;
    targetMetric: string;
    owner: string;
    linearInitiative: string;
    keyProduct?: string;
    keyWork?: string;
  }
> = {
  waif: {
    goal: "Save 501K hours (60% of 835K company goal) = 241 FTE = ~$49M",
    targetMetric: "501,000 hours saved",
    owner: "Drew Kull",
    linearInitiative: "Working AI First",
  },
  enterprise: {
    goal: "70% Braze win rate",
    targetMetric: "70% Braze win rate",
    owner: "Drew Kull / Jenna Eldredge",
    linearInitiative: "Enterprise initiative",
    keyProduct: "KDS (Klaviyo Demo Studio)",
  },
  growth: {
    goal: "Increase SQLs/MQLs by 22%",
    targetMetric: "SQLs/MQLs +22%",
    owner: "Drew Kull / Richard Ng",
    linearInitiative: "Growth initiative",
    keyWork:
      "CMS migration, content pipeline, experimentation platform, visitor intelligence",
  },
};

export const ORG_CONFIGS: OrgConfig[] = [
  {
    slug: "sales",
    label: "Sales",
    teamNames: ["Amplify Sales"],
    goalName: "Increase Seller PPR by 30%",
    pmOwner: "Jay Chiruvolu",
    initiatives: ["waif", "enterprise"],
  },
  {
    slug: "demos",
    label: "Demos",
    teamNames: ["Amplify Demos"],
    goalName: "Scale demo delivery & self-service",
    pmOwner: "Jenna Eldredge",
    initiatives: ["enterprise", "waif"],
  },
  {
    slug: "support",
    label: "Support",
    teamNames: ["Amplify Support"],
    goalName: "Achieve 70% AI deflection rate in customer support",
    pmOwner: "Jeremy Blanchard",
    initiatives: ["waif"],
  },
  {
    slug: "cs",
    label: "CS/Services",
    teamNames: ["Amplify Success & Services"],
    goalName: "Increase CSM time with customers by 30%",
    pmOwner: "Tyler Beck",
    initiatives: ["waif"],
  },
  {
    slug: "rnd",
    label: "R&D",
    teamNames: ["Amplify R&D"],
    goalName: "Reduce PM + Design admin toil by 80%",
    pmOwner: "Christina Valente",
    initiatives: ["waif"],
  },
  {
    slug: "marketing",
    label: "Marketing",
    teamNames: ["Amplify Marketing", "Amplify Content Platform"],
    goalName: "Achieve <10% dev-dependent content changes",
    pmOwner: "Richard Ng",
    initiatives: ["waif", "growth"],
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
