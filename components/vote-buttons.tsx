"use client";

import { useState } from "react";

interface VoteButtonsProps {
  submissionId: string;
  builderVotes: number;
  learnerVotes: number;
  likeCount: number;
  isLiked: boolean;
  userBuilderVote: string | null;
  userLearnerVote: string | null;
  userEmail: string | null;
  userName: string | null;
  votingOpen: boolean;
  onVote: (submissionId: string, category: "builder" | "learner") => void;
  onLike: (submissionId: string) => void;
}

export function VoteButtons({
  submissionId,
  builderVotes,
  learnerVotes,
  likeCount,
  isLiked,
  userBuilderVote,
  userLearnerVote,
  userEmail,
  userName,
  votingOpen,
  onVote,
  onLike,
}: VoteButtonsProps) {
  const [loading, setLoading] = useState<"builder" | "learner" | null>(null);
  const [likeLoading, setLikeLoading] = useState(false);

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

  const handleLike = async () => {
    if (!userEmail || likeLoading) return;
    setLikeLoading(true);
    try {
      await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, userEmail }),
      });
      onLike(submissionId);
    } catch {
      // Silently fail
    } finally {
      setLikeLoading(false);
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

      <button
        onClick={handleLike}
        disabled={!userEmail || likeLoading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
          isLiked
            ? "bg-pink-500/20 text-pink-400 border-pink-500/40 shadow-sm"
            : "bg-surface-2 text-text-secondary border-border hover:text-text hover:border-pink-500/30"
        } ${!userEmail ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span>{likeLoading ? "..." : isLiked ? "❤️" : "🤍"}</span>
        <span className="bg-bg/50 px-1.5 py-0.5 rounded text-[10px] tabular-nums font-semibold">
          {likeCount}
        </span>
      </button>
    </div>
  );
}
