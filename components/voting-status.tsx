"use client";

import { useEffect, useState, useMemo } from "react";
import type { VotingPeriod, Award, Submission, SubmissionWithVotes } from "@/lib/supabase-types";

interface PeriodResponse {
  period: VotingPeriod | null;
  awards: (Award & { submissions: Submission })[] | null;
  previousPeriod: VotingPeriod | null;
  previousAwards: (Award & { submissions: Submission })[] | null;
}

const GOAT_QUOTES = [
  "🐐 Mountain goats don't wait for the trail — they build it. Post a Loom!",
  "🐐 $15 gift card + a 3D goat trophy. All you gotta do is ship & record.",
  "🐐 The summit is lonely without demos. Be the GOAT — post a Loom!",
  "🐐 No demos yet this week? That's a lot of unclaimed goats...",
  "🐐 Every Loom you post is a step up the mountain. Who's climbing?",
  "🐐 Baaaa! 🎤 The stage is empty. Record a Loom and steal the show!",
  "🐐 Fun fact: goats that demo get gift cards. Goats that don't... just get hay.",
  "🐐 Your teammates can't vote for you if they can't see what you built!",
  "🐐 501K hours won't save themselves. Show us what you shipped!",
  "🐐 A Loom a day keeps the boredom away. Post one now!",
];

function formatCountdown(closesAt: string): string {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return "closing soon";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}

const MEDALS = ["🥇", "🥈", "🥉"];

interface VotingStatusProps {
  submissions?: SubmissionWithVotes[];
}

function WinnerLink({ award, label }: { award: Award & { submissions: Submission }; label: string }) {
  const loomUrl = award.submissions?.loom_url;
  return (
    <span className="inline-flex items-center gap-1">
      <strong>{award.winner_name}</strong>
      <span className="text-xs opacity-70">({label})</span>
      {loomUrl && (
        <a
          href={loomUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-xs underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
        >
          ▶ Watch
        </a>
      )}
    </span>
  );
}

export function VotingStatus({ submissions = [] }: VotingStatusProps) {
  const [data, setData] = useState<PeriodResponse | null>(null);
  const [countdown, setCountdown] = useState("");
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * GOAT_QUOTES.length));
  }, []);

  useEffect(() => {
    fetch("/api/voting-period")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!data?.period || data.period.status !== "open") return;
    const update = () => setCountdown(formatCountdown(data.period!.closes_at));
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [data]);

  // Top 3 by total votes
  const leaderboard = useMemo(() => {
    return [...submissions]
      .map((s) => ({ ...s, totalVotes: s.builder_votes + s.learner_votes }))
      .filter((s) => s.totalVotes > 0)
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 3);
  }, [submissions]);

  if (!data?.period) return null;

  const { period, awards, previousAwards } = data;

  // Previous week's winners banner
  const prevBuilder = previousAwards?.find((a) => a.category === "builder");
  const prevLearner = previousAwards?.find((a) => a.category === "learner");
  const hasPrevWinners = prevBuilder || prevLearner;

  // Current week announced
  if (period.status === "announced" && awards && awards.length > 0) {
    const builder = awards.find((a) => a.category === "builder");
    const learner = awards.find((a) => a.category === "learner");
    return (
      <div className="space-y-3 mb-6">
        <div className="rounded-xl border border-accent/30 bg-accent/8 p-4">
          <p className="text-sm font-semibold text-accent-light flex flex-wrap items-center gap-1.5">
            🐐 This week&apos;s GOATs:{" "}
            {builder && <WinnerLink award={builder} label="Builder" />}
            {builder && learner && <span>&</span>}
            {learner && <WinnerLink award={learner} label="Learner" />}
          </p>
        </div>
      </div>
    );
  }

  // Voting closed
  if (period.status === "closed") {
    return (
      <div className="space-y-3 mb-6">
        {hasPrevWinners && (
          <PreviousWinnersBanner builder={prevBuilder} learner={prevLearner} />
        )}
        <div className="rounded-xl border border-orange/30 bg-orange/8 p-4">
          <p className="text-sm font-medium text-orange">
            Voting closed — winners being tallied
          </p>
        </div>
      </div>
    );
  }

  // Voting open
  return (
    <div className="space-y-3 mb-6">
      {hasPrevWinners && (
        <PreviousWinnersBanner builder={prevBuilder} learner={prevLearner} />
      )}
      <div className="rounded-xl border border-green/30 bg-green/8 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-green">
            Voting open — closes Friday 4:00 PM ET
          </p>
          <span className="text-xs text-green/80 font-mono tabular-nums">{countdown}</span>
        </div>

        {leaderboard.length > 0 ? (
          <div className="flex gap-4 mt-2">
            {leaderboard.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{MEDALS[i]}</span>
                <div className="min-w-0">
                  <p className="text-xs text-text font-medium truncate">{s.submitter_name}</p>
                  <p className="text-[10px] text-green/70 truncate">{s.title}</p>
                </div>
                <span className="text-xs text-green font-bold tabular-nums shrink-0 ml-1">
                  {s.totalVotes}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-green/70 mt-1">
            {GOAT_QUOTES[quoteIndex]}
          </p>
        )}
      </div>
    </div>
  );
}

function PreviousWinnersBanner({
  builder,
  learner,
}: {
  builder?: (Award & { submissions: Submission }) | null;
  learner?: (Award & { submissions: Submission }) | null;
}) {
  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
      <p className="text-xs font-semibold text-accent-light/80 flex flex-wrap items-center gap-1.5">
        🏆 Last week&apos;s GOATs:{" "}
        {builder && <WinnerLink award={builder} label="Builder" />}
        {builder && learner && <span className="text-accent-light/50">&</span>}
        {learner && <WinnerLink award={learner} label="Learner" />}
      </p>
    </div>
  );
}
