"use client";

import { useEffect, useState } from "react";
import type { Award, CampTier } from "@/lib/supabase-types";

interface LeaderboardEntry {
  name: string;
  total: number;
  builder: number;
  learner: number;
  tier: CampTier | null;
}

const DEFAULT_TIERS: CampTier[] = [
  { name: "Base Camper", emoji: "🏕️", threshold: 1 },
  { name: "Ridge Runner", emoji: "🏔️", threshold: 3 },
  { name: "Summit Seeker", emoji: "⛰️", threshold: 5 },
  { name: "Peak Performer", emoji: "🗻", threshold: 8 },
  { name: "GOAT of GOATs", emoji: "🐐👑", threshold: 12 },
];

function getTier(total: number, tiers: CampTier[]): CampTier | null {
  const sorted = [...tiers].sort((a, b) => b.threshold - a.threshold);
  return sorted.find((t) => total >= t.threshold) ?? null;
}

export function SummitBoard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [tiers, setTiers] = useState<CampTier[]>(DEFAULT_TIERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch awards and config in parallel
        const [awardsRes, configRes] = await Promise.all([
          fetch("/api/awards"),
          fetch("/api/config?key=camp_tiers"),
        ]);

        const awardsData = await awardsRes.json();
        const configData = await configRes.json();

        if (configData.config?.value) {
          const parsedTiers = typeof configData.config.value === "string"
            ? JSON.parse(configData.config.value)
            : configData.config.value;
          if (Array.isArray(parsedTiers)) setTiers(parsedTiers);
        }

        // Aggregate awards by winner name
        const awards: Award[] = awardsData.awards ?? [];
        const byName = new Map<string, { builder: number; learner: number }>();

        for (const award of awards) {
          const existing = byName.get(award.winner_name) ?? { builder: 0, learner: 0 };
          if (award.category === "builder") existing.builder++;
          else existing.learner++;
          byName.set(award.winner_name, existing);
        }

        const leaderboard: LeaderboardEntry[] = Array.from(byName.entries())
          .map(([name, counts]) => ({
            name,
            total: counts.builder + counts.learner,
            builder: counts.builder,
            learner: counts.learner,
            tier: getTier(counts.builder + counts.learner, configData.config?.value ?? DEFAULT_TIERS),
          }))
          .sort((a, b) => b.total - a.total);

        setEntries(leaderboard);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 mb-4">
          <span className="text-2xl">⛰️</span>
        </div>
        <p className="text-text-secondary text-sm font-medium mb-1">No awards yet</p>
        <p className="text-text-secondary/60 text-xs">Winners will appear here after the first voting period closes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem_8rem] gap-2 px-4 py-2 text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
        <span>#</span>
        <span>Name</span>
        <span className="text-center">Total</span>
        <span className="text-center">🔨</span>
        <span className="text-center">📚</span>
        <span>Camp Tier</span>
      </div>

      {entries.map((entry, i) => {
        const tier = getTier(entry.total, tiers);
        return (
          <div
            key={entry.name}
            className={`grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem_8rem] gap-2 items-center px-4 py-3 rounded-xl transition-colors ${
              i === 0
                ? "bg-accent/8 border border-accent/20"
                : "bg-surface border border-border hover:bg-surface-2"
            }`}
          >
            <span className={`text-sm font-bold tabular-nums ${i === 0 ? "text-accent-light" : "text-text-secondary"}`}>
              {i + 1}
            </span>
            <span className="text-sm font-medium text-text truncate">{entry.name}</span>
            <span className="text-sm font-bold text-text text-center tabular-nums">{entry.total}</span>
            <span className="text-xs text-text-secondary text-center tabular-nums">{entry.builder}</span>
            <span className="text-xs text-text-secondary text-center tabular-nums">{entry.learner}</span>
            <span className="text-xs font-medium text-text-secondary">
              {tier ? `${tier.emoji} ${tier.name}` : "—"}
            </span>
          </div>
        );
      })}

      {/* Tier legend */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider mb-3">Camp Tiers</p>
        <div className="flex flex-wrap gap-3">
          {tiers.map((tier) => (
            <div key={tier.name} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span>{tier.emoji}</span>
              <span>{tier.name}</span>
              <span className="text-text-secondary/50">({tier.threshold}+)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
