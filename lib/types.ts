export type OrgSlug = "sales" | "support" | "cs" | "rnd" | "marketing";

export type HealthStatus = "onTrack" | "atRisk" | "offTrack" | "none";

export interface OrgConfig {
  slug: OrgSlug;
  label: string;
  teamNames: string[];
  goalName: string;
  pmOwner: string;
}

export interface ProjectStatus {
  name: string;
  color: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  health: HealthStatus;
  teamName: string;
  orgSlug: OrgSlug;
  latestUpdate: string | null;
  latestUpdateDate: string | null;
  milestones: MilestoneSummary[];
  completedAt: string | null;
  updatedAt: string;
  startDate: string | null;
  targetDate: string | null;
  progress: number;
  status: ProjectStatus;
  lead: string | null;
}

export interface MilestoneSummary {
  id: string;
  name: string;
  targetDate: string | null;
  sortOrder: number;
}

export interface GoalSummary {
  id: string;
  name: string;
  health: HealthStatus;
  orgSlug: OrgSlug;
  pmOwner: string;
  latestUpdate: string | null;
  latestUpdateDate: string | null;
  projects: ProjectSummary[];
}

export interface DemoEntry {
  id: string;
  loomUrl: string;
  title: string;
  orgSlug: OrgSlug;
  projectName: string;
  date: string;
}

export interface DigestEntry {
  id: string;
  orgSlug: OrgSlug;
  goalName: string;
  health: HealthStatus;
  content: string;
  date: string;
  month: string;
}

export interface ShippedEntry {
  id: string;
  projectName: string;
  orgSlug: OrgSlug;
  completedAt: string;
  lastUpdate: string;
  loomUrl: string | null;
}

export interface IntakeRequest {
  name: string;
  team: OrgSlug;
  requestType: string;
  urgency: string;
  description: string;
}

export interface ActivityItem {
  type: "shipped" | "demo" | "update";
  title: string;
  orgSlug: OrgSlug;
  date: string;
  detail: string;
}
