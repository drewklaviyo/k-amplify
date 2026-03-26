"use client";

import { useEffect, useState } from "react";
import type { VotingPeriod, Award, Submission } from "@/lib/supabase-types";

interface PeriodResponse {
  period: VotingPeriod | null;
  awards: (Award & { submissions: Submission })[] | null;
}

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

export function VotingStatus() {
  const [data, setData] = useState<PeriodResponse | null>(null);
  const [countdown, setCountdown] = useState("");

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

  if (!data?.period) return null;

  const { period, awards } = data;

  if (period.status === "announced" && awards && awards.length > 0) {
    const builder = awards.find((a) => a.category === "builder");
    const learner = awards.find((a) => a.category === "learner");
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/8 p-4 mb-6">
        <p className="text-sm font-semibold text-accent-light">
          🐐 This week&apos;s GOATs: {builder?.winner_name ?? "TBD"} (Builder) & {learner?.winner_name ?? "TBD"} (Learner)
        </p>
      </div>
    );
  }

  if (period.status === "closed") {
    return (
      <div className="rounded-xl border border-orange/30 bg-orange/8 p-4 mb-6">
        <p className="text-sm font-medium text-orange">
          Voting closed — winners announced by noon Friday
        </p>
      </div>
    );
  }

  // Open
  return (
    <div className="rounded-xl border border-green/30 bg-green/8 p-4 mb-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-green">
          Voting open — closes Friday 4:00 PM ET
        </p>
        <span className="text-xs text-green/80 font-mono tabular-nums">{countdown}</span>
      </div>
    </div>
  );
}
