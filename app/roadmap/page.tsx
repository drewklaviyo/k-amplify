"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoalSummary, OrgSlug } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";
import { useLayout } from "@/components/layout-context";
import { OrgFilter } from "@/components/org-filter";
import { ProjectCard } from "@/components/project-card";
import { RoadmapTimeline } from "@/components/roadmap-timeline";
import { TimelineSkeleton, CardSkeleton } from "@/components/skeleton";

type ViewMode = "timeline" | "list";

function RoadmapContent() {
  const searchParams = useSearchParams();
  const initialTeam = (searchParams.get("team") as OrgSlug | null) ?? "all";

  const [filter, setFilter] = useState<OrgSlug | "all">(initialTeam);
  const [view, setView] = useState<ViewMode>("timeline");
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { setWide } = useLayout();

  useEffect(() => {
    setLoading(true);
    const params = filter === "all" ? "" : `?team=${filter}`;
    fetch(`/api/roadmap${params}`)
      .then((r) => r.json())
      .then((data) => setGoals(data.goals ?? []))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, [filter]);

  // Widen the layout when in timeline view
  useEffect(() => {
    setWide(view === "timeline");
    return () => { setWide(false); };
  }, [view, setWide]);

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <OrgFilter selected={filter} onChange={setFilter} />
        <div className="flex gap-0.5 bg-surface border border-border rounded-xl p-1">
          <button
            onClick={() => setView("timeline")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              view === "timeline"
                ? "bg-accent/15 text-accent-light shadow-sm border border-accent/20"
                : "text-text-secondary hover:text-text border border-transparent"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h14" />
            </svg>
            Timeline
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              view === "list"
                ? "bg-accent/15 text-accent-light shadow-sm border border-accent/20"
                : "text-text-secondary hover:text-text border border-transparent"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </button>
        </div>
      </div>

      {loading ? (
        view === "timeline" ? (
          <TimelineSkeleton />
        ) : (
          <div>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )
      ) : goals.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 mb-4">
            <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-text-secondary text-sm font-medium mb-1">No projects found</p>
          <p className="text-text-secondary/60 text-xs">Projects will appear here once they are added to Linear.</p>
        </div>
      ) : view === "timeline" ? (
        <RoadmapTimeline goals={goals} />
      ) : filter === "all" ? (
        <div className="animate-in">
          {goals.map((goal) => (
            <div key={goal.id} className="mb-8">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">
                {ORG_BY_SLUG[goal.orgSlug].label} — {goal.name}
              </h2>
              {goal.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-in">
          {goals.flatMap((goal) =>
            goal.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      )}
    </>
  );
}

export default function RoadmapPage() {
  return (
    <div className="pt-10 animate-in">
      <h1 className="text-xl font-bold tracking-tight mb-1">Roadmap</h1>
      <p className="text-text-secondary text-sm mb-6">
        Active projects across all Amplify teams.
      </p>
      <Suspense fallback={<TimelineSkeleton />}>
        <RoadmapContent />
      </Suspense>
    </div>
  );
}
