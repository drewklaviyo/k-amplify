"use client";

import { useState } from "react";

interface VoteButtonsProps {
  submissionId: string;
  builderVotes: number;
  learnerVotes: number;
  userBuilderVote: string | null; // submission ID the user voted for as builder
  userLearnerVote: string | null; // submission ID the user voted for as learner
  userEmail: string | null;
  userName: string | null;
  votingOpen: boolean;
  onVote: (submissionId: string, category: "builder" | "learner") => void;
}

export function VoteButtons({
  submissionId,
  builderVotes,
  learnerVotes,
  userBuilderVote,
  userLearnerVote,
  userEmail,
  userName,
  votingOpen,
  onVote,
}: VoteButtonsProps) {
  const [loading, setLoading] = useState<"builder" | "learner" | null>(null);

  const isBuilderVoted = userBuilderVote === submissionId;
  const isLearnerVoted = userLearnerVote === submissionId;

  const handleVote = async (category: "builder" | "learner") => {
    if (!userEmail || !votingOpen || loading) return;
    setLoading(category);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          category,
          userEmail,
          userName,
        }),
      });

      if (res.ok) {
        onVote(submissionId, category);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => handleVote("builder")}
        disabled={!votingOpen || !userEmail || loading === "builder"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
          isBuilderVoted
            ? "bg-accent/20 text-accent-light border-accent/40 shadow-sm"
            : "bg-surface-2 text-text-secondary border-border hover:text-text hover:border-accent/30"
        } ${(!votingOpen || !userEmail) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span>{loading === "builder" ? "..." : "🔨"}</span>
        <span>Builder</span>
        <span className="bg-bg/50 px-1.5 py-0.5 rounded text-[10px] tabular-nums font-semibold">
          {builderVotes}
        </span>
      </button>

      <button
        onClick={() => handleVote("learner")}
        disabled={!votingOpen || !userEmail || loading === "learner"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
          isLearnerVoted
            ? "bg-blue/20 text-blue border-blue/40 shadow-sm"
            : "bg-surface-2 text-text-secondary border-border hover:text-text hover:border-blue/30"
        } ${(!votingOpen || !userEmail) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span>{loading === "learner" ? "..." : "📚"}</span>
        <span>Learner</span>
        <span className="bg-bg/50 px-1.5 py-0.5 rounded text-[10px] tabular-nums font-semibold">
          {learnerVotes}
        </span>
      </button>
    </div>
  );
}
