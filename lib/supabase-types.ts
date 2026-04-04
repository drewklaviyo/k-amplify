// TypeScript types matching the Supabase schema

export interface Person {
  id: string;
  linear_id: string;
  name: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  org_slug: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  loom_url: string;
  title: string;
  submitter_name: string;
  submitter_linear_id: string | null;
  org_slug: string;
  source_type: "project_update" | "issue_comment";
  source_id: string;
  source_project_name: string | null;
  source_url: string | null;
  description: string | null;
  voting_period_id: string | null;
  posted_at: string;
  created_at: string;
}

export interface VotingPeriod {
  id: string;
  week_label: string;
  opens_at: string;
  closes_at: string;
  status: "open" | "closed" | "announced";
  created_at: string;
}

export interface Vote {
  id: string;
  user_email: string;
  user_name: string;
  submission_id: string;
  category: "builder" | "learner";
  voting_period_id: string;
  created_at: string;
}

export interface Award {
  id: string;
  submission_id: string;
  voting_period_id: string;
  category: "builder" | "learner";
  vote_count: number;
  winner_name: string;
  goat_name: string | null;
  created_at: string;
}

export interface Progress {
  id: string;
  week_label: string;
  estimated_hours: number;
  cumulative_hours: number;
  note: string | null;
  updated_by: string;
  created_at: string;
}

export interface HoursSaved {
  id: string;
  org_slug: string;
  week_label: string;
  hours: number;
  note: string | null;
  updated_by: string;
  created_at: string;
}

export interface ConfigRow {
  key: string;
  value: unknown;
  updated_at: string;
}

export interface CampTier {
  name: string;
  emoji: string;
  threshold: number;
}

export interface VotingWindow {
  open_day: string;
  close_day: string;
  close_time: string;
  timezone: string;
}

// Submission with vote counts for display
export interface SubmissionWithVotes extends Submission {
  builder_votes: number;
  learner_votes: number;
  is_builder_winner?: boolean;
  is_learner_winner?: boolean;
}

// Award with submission details for display
export interface AwardWithDetails extends Award {
  submission?: Submission;
  org_slug?: string;
}
