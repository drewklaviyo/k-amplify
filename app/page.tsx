"use client";

import { useEffect, useState } from "react";
import { GoalSummary, DemoEntry, OrgSlug } from "@/lib/types";
import { OrgCard } from "@/components/org-card";
import { GridSkeleton } from "@/components/skeleton";

export default function HomePage() {
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [demoCounts, setDemoCounts] = useState<Record<OrgSlug, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    Promise.all([
      fetch("/api/roadmap").then((r) => r.json()),
      fetch("/api/demos").then((r) => r.json()),
    ])
      .then(([roadmapData, demosData]) => {
        setGoals(roadmapData.goals ?? []);
        const counts: Record<string, number> = {};
        for (const entry of (demosData.entries ?? []) as DemoEntry[]) {
          if (new Date(entry.date) >= monthStart) {
            counts[entry.orgSlug] = (counts[entry.orgSlug] ?? 0) + 1;
          }
        }
        setDemoCounts(counts as Record<OrgSlug, number>);
      })
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, []);

  // Compute summary stats
  const totalProjects = goals.reduce((sum, g) => sum + g.projects.length, 0);
  const onTrackCount = goals.filter((g) => g.health === "onTrack").length;
  const atRiskCount = goals.filter((g) => g.health === "atRisk").length;
  const offTrackCount = goals.filter((g) => g.health === "offTrack").length;

  return (
    <div className="pt-10 animate-in">
      <h1 className="text-[2.2rem] font-bold tracking-tight leading-tight mb-2 bg-gradient-to-br from-text to-accent-light bg-clip-text text-transparent">
        K Amplify
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        What Amplify is building across every partner org — live from Linear.
      </p>

      {loading ? (
        <GridSkeleton count={5} />
      ) : (
        <>
          {/* Executive summary strip */}
          {goals.length > 0 && (
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                <span className="text-[0.7rem] text-text-secondary font-medium">Orgs</span>
                <span className="text-sm font-bold tabular-nums">{goals.length}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                <span className="text-[0.7rem] text-text-secondary font-medium">Projects</span>
                <span className="text-sm font-bold tabular-nums">{totalProjects}</span>
              </div>
              {onTrackCount > 0 && (
                <div className="flex items-center gap-2 bg-green/8 border border-green/20 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <span className="text-[0.7rem] text-green font-medium">{onTrackCount} on track</span>
                </div>
              )}
              {atRiskCount > 0 && (
                <div className="flex items-center gap-2 bg-orange/8 border border-orange/20 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-orange" />
                  <span className="text-[0.7rem] text-orange font-medium">{atRiskCount} at risk</span>
                </div>
              )}
              {offTrackCount > 0 && (
                <div className="flex items-center gap-2 bg-red/8 border border-red/20 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-red" />
                  <span className="text-[0.7rem] text-red font-medium">{offTrackCount} off track</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
            {goals.map((goal) => (
              <OrgCard
                key={goal.id}
                goal={goal}
                demoCount={demoCounts?.[goal.orgSlug] ?? 0}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
