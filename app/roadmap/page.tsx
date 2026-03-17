"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoalSummary, OrgSlug } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";
import { OrgFilter } from "@/components/org-filter";
import { ProjectCard } from "@/components/project-card";
import { RoadmapTimeline } from "@/components/roadmap-timeline";

type ViewMode = "timeline" | "list";

function RoadmapContent() {
  const searchParams = useSearchParams();
  const initialTeam = (searchParams.get("team") as OrgSlug | null) ?? "all";

  const [filter, setFilter] = useState<OrgSlug | "all">(initialTeam);
  const [view, setView] = useState<ViewMode>("timeline");
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter === "all" ? "" : `?team=${filter}`;
    fetch(`/api/roadmap${params}`)
      .then((r) => r.json())
      .then((data) => setGoals(data.goals ?? []))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, [filter]);

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
                : "text-text-secondary hover:text-text"
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
                : "text-text-secondary hover:text-text"
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
        <div className="text-text-secondary text-sm">Loading...</div>
      ) : goals.length === 0 ? (
        <div className="text-text-secondary text-sm">No projects found.</div>
      ) : view === "timeline" ? (
        <RoadmapTimeline goals={goals} />
      ) : filter === "all" ? (
        goals.map((goal) => (
          <div key={goal.id} className="mb-8">
            <h2 className="text-sm font-semibold text-text-secondary mb-3">
              {ORG_BY_SLUG[goal.orgSlug].label} — {goal.name}
            </h2>
            {goal.projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ))
      ) : (
        goals.flatMap((goal) =>
          goal.projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )
      )}
    </>
  );
}

export default function RoadmapPage() {
  return (
    <div className="pt-10">
      <h1 className="text-xl font-bold tracking-tight mb-1">Roadmap</h1>
      <p className="text-text-secondary text-sm mb-6">
        Active projects across all Amplify teams.
      </p>
      <Suspense fallback={<div className="text-text-secondary text-sm">Loading...</div>}>
        <RoadmapContent />
      </Suspense>
    </div>
  );
}
