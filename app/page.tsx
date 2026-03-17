"use client";

import { useEffect, useState } from "react";
import { GoalSummary, DemoEntry, OrgSlug } from "@/lib/types";
import { OrgCard } from "@/components/org-card";

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

  return (
    <div className="pt-10">
      <h1 className="text-[2.2rem] font-bold tracking-tight leading-tight mb-2 bg-gradient-to-br from-text to-accent-light bg-clip-text text-transparent">
        K Amplify
      </h1>
      <p className="text-text-secondary text-sm mb-8">
        What Amplify is building across every partner org — live from Linear.
      </p>

      {loading ? (
        <div className="text-text-secondary text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <OrgCard
              key={goal.id}
              goal={goal}
              demoCount={demoCounts?.[goal.orgSlug] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
