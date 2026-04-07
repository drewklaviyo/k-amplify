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
    linearInitiativeId: string | null;
    linearSubInitiativeIds?: string[];
    linearUrl: string;
    keyProduct?: string;
    keyWork?: string;
  }
> = {
  waif: {
    goal: "Save 501K hours (60% of 835K company goal) = 241 FTE = ~$49M",
    targetMetric: "501,000 hours saved",
    owner: "Drew Kull",
    linearInitiative: "Working AI First",
    linearInitiativeId: "de568318-0bc7-4695-b4d1-441e472a5ccf",
    linearUrl: "https://linear.app/klaviyo/initiative/working-ai-first-af1ae3ab59d8",
  },
  enterprise: {
    goal: "Deliver a Secure, Scalable Global Enterprise Platform",
    targetMetric: "Enterprise platform",
    owner: "Drew Kull / Jenna Eldredge",
    linearInitiative: "Deliver a Secure, Scalable Global Enterprise Platform",
    linearInitiativeId: "7f621067-21a7-401f-87b5-82e7c74acbea",
    linearSubInitiativeIds: [
      "4e2f1ca6-4263-4e2e-a5d7-06979c8ad15a", // Demo and Sandbox Environments (Jenna)
      "69d835d6-5677-4ee6-a749-b0b58e56d13c", // Organizations (Jenna)
    ],
    linearUrl: "https://linear.app/klaviyo/initiative/1-deliver-a-secure-scalable-global-enterprise-platform-b6d02ef57e39",
    keyProduct: "KDS (Klaviyo Demo Studio)",
  },
  growth: {
    goal: "Increase sign ups by 18% (ENTR: 500K up from 421K, SMB: 24K flat YoY)",
    targetMetric: "Sign ups +18%",
    owner: "Drew Kull / Richard Ng",
    linearInitiative: "Increase sign ups by 18%",
    linearInitiativeId: "41edf40b-13dd-4079-8e21-e9250288e585",
    linearUrl: "https://linear.app/klaviyo/initiative/increase-sign-ups-by-18percent-entr-500k-up-from-421k-smb-24k-flat-yoy-5c1a95a6472c",
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
    label: "Success/Services",
    teamNames: ["Amplify Success & Services"],
    goalName: "Increase CSM time with customers by 30%",
    pmOwner: "Tyler Beck",
    initiatives: ["waif"],
  },
  {
    slug: "rnd",
    label: "R&D",
    teamNames: ["Amplify R&D", "Amplify"],
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
