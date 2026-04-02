"use client";

import type { SubmissionWithVotes } from "@/lib/supabase-types";
import { VoteButtons } from "./vote-buttons";

const ORG_COLORS: Record<string, string> = {
  sales: "#6c5ce7",
  demos: "#a29bfe",
  support: "#00b894",
  cs: "#74b9ff",
  rnd: "#fdcb6e",
  marketing: "#e17055",
};

const ORG_LABELS: Record<string, string> = {
  sales: "Sales",
  demos: "Demos",
  support: "Support",
  cs: "CS/Services",
  rnd: "R&D",
  marketing: "Marketing",
};

function toEmbedUrl(loomUrl: string): string {
  return loomUrl.replace("/share/", "/embed/");
}

interface DemoSubmissionCardProps {
  submission: SubmissionWithVotes;
  userBuilderVote: string | null;
  userLearnerVote: string | null;
  userEmail: string | null;
  userName: string | null;
  votingOpen: boolean;
  showVoting: boolean;
  onVote: (submissionId: string, category: "builder" | "learner") => void;
  likeCount?: number;
  isLiked?: boolean;
  onLike?: (submissionId: string) => void;
}

export function DemoSubmissionCard({
  submission,
  userBuilderVote,
  userLearnerVote,
  userEmail,
  userName,
  votingOpen,
  showVoting,
  onVote,
  likeCount = 0,
  isLiked = false,
  onLike,
}: DemoSubmissionCardProps) {
  const orgColor = ORG_COLORS[submission.org_slug] ?? "#8888a0";
  const orgLabel = ORG_LABELS[submission.org_slug] ?? submission.org_slug;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all shadow-sm shadow-black/10 group">
      {/* Loom embed */}
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={toEmbedUrl(submission.loom_url)}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
          title={`Demo: ${submission.title}`}
        />
      </div>

      <div className="p-4">
        {/* Title + org tag + GOAT badge */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h3 className="font-semibold text-sm">{submission.title}</h3>
          <span
            className="text-[0.68rem] font-medium px-2 py-0.5 rounded-md border"
            style={{
              backgroundColor: orgColor + "1F",
              color: orgColor,
              borderColor: orgColor + "40",
            }}
          >
            {orgLabel}
          </span>
          {submission.source_url && (
            <a
              href={submission.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.68rem] text-text-secondary hover:text-accent-light transition-colors flex items-center gap-1"
              title="View in Linear"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Linear
            </a>
          )}
          {submission.is_builder_winner && (
            <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-md bg-accent/15 text-accent-light border border-accent/25">
              🐐 Builder
            </span>
          )}
          {submission.is_learner_winner && (
            <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-md bg-blue/15 text-blue border border-blue/25">
              🐐 Learner
            </span>
          )}
        </div>

        {/* Submitter + source + date */}
        <p className="text-text-secondary text-xs">
          {submission.submitter_name}
          {submission.source_project_name && (
            <> &middot; from {submission.source_project_name}</>
          )}
          {" "}&middot;{" "}
          {new Date(submission.posted_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        {/* Vote buttons */}
        {showVoting && (
          <VoteButtons
            submissionId={submission.id}
            builderVotes={submission.builder_votes}
            learnerVotes={submission.learner_votes}
            likeCount={likeCount}
            isLiked={isLiked}
            userBuilderVote={userBuilderVote}
            userLearnerVote={userLearnerVote}
            userEmail={userEmail}
            userName={userName}
            votingOpen={votingOpen}
            onVote={onVote}
            onLike={onLike ?? (() => {})}
          />
        )}
      </div>
    </div>
  );
}
