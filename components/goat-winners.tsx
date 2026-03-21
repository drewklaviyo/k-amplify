"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Award, Submission, VotingPeriod } from "@/lib/supabase-types";

const ORG_COLORS: Record<string, string> = {
  sales: "#6c5ce7",
  demos: "#a29bfe",
  support: "#00b894",
  cs: "#74b9ff",
  rnd: "#fdcb6e",
  marketing: "#e17055",
};

interface AwardWithSubmission extends Award {
  submissions: Submission;
}

interface PeriodResponse {
  period: VotingPeriod | null;
  awards: AwardWithSubmission[] | null;
}

export function GoatWinners() {
  const [data, setData] = useState<PeriodResponse | null>(null);

  useEffect(() => {
    fetch("/api/voting-period")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data?.period) return null;

  const { period, awards } = data;

  // Only show if announced
  if (period.status !== "announced" || !awards || awards.length === 0) {
    if (period.status === "open") {
      return (
        <div className="rounded-xl border border-border bg-surface p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text mb-1">🐐 GOAT Awards — Voting Open</p>
              <p className="text-xs text-text-secondary">Cast your votes for this week&apos;s best Builder and Learner demos.</p>
            </div>
            <Link
              href="/demos"
              className="text-xs font-medium text-accent-light hover:text-accent transition-colors"
            >
              Cast your votes &rarr;
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  const builder = awards.find((a) => a.category === "builder");
  const learner = awards.find((a) => a.category === "learner");

  return (
    <div className="rounded-xl border border-accent/25 bg-surface p-5 mb-6 border-gradient">
      <p className="text-sm font-bold text-text mb-3">🐐 This Week&apos;s GOATs</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {builder && (
          <div className="flex items-start gap-3 bg-bg rounded-lg p-3 border border-border">
            <span className="text-lg">🔨</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-accent-light mb-0.5">GOAT Builder</p>
              <p className="text-sm font-medium text-text truncate">{builder.winner_name}</p>
              <p className="text-xs text-text-secondary truncate">{builder.submissions?.title}</p>
              {builder.submissions?.org_slug && (
                <span
                  className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 border"
                  style={{
                    color: ORG_COLORS[builder.submissions.org_slug] ?? "#8888a0",
                    backgroundColor: (ORG_COLORS[builder.submissions.org_slug] ?? "#8888a0") + "1F",
                    borderColor: (ORG_COLORS[builder.submissions.org_slug] ?? "#8888a0") + "40",
                  }}
                >
                  {builder.submissions.org_slug}
                </span>
              )}
            </div>
          </div>
        )}
        {learner && (
          <div className="flex items-start gap-3 bg-bg rounded-lg p-3 border border-border">
            <span className="text-lg">📚</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue mb-0.5">GOAT Learner</p>
              <p className="text-sm font-medium text-text truncate">{learner.winner_name}</p>
              <p className="text-xs text-text-secondary truncate">{learner.submissions?.title}</p>
              {learner.submissions?.org_slug && (
                <span
                  className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 border"
                  style={{
                    color: ORG_COLORS[learner.submissions.org_slug] ?? "#8888a0",
                    backgroundColor: (ORG_COLORS[learner.submissions.org_slug] ?? "#8888a0") + "1F",
                    borderColor: (ORG_COLORS[learner.submissions.org_slug] ?? "#8888a0") + "40",
                  }}
                >
                  {learner.submissions.org_slug}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mt-3">
        <Link
          href="/demos"
          className="text-xs text-text-secondary hover:text-accent-light transition-colors"
        >
          See all demos &rarr;
        </Link>
      </div>
    </div>
  );
}
