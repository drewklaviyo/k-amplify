"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoalSummary, OrgSlug } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";
import { OrgFilter } from "@/components/org-filter";
import { ProjectCard } from "@/components/project-card";

function RoadmapContent() {
  const searchParams = useSearchParams();
  const initialTeam = (searchParams.get("team") as OrgSlug | null) ?? "all";

  const [filter, setFilter] = useState<OrgSlug | "all">(initialTeam);
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
      <OrgFilter selected={filter} onChange={setFilter} />

      {loading ? (
        <div className="text-text-secondary text-sm">Loading...</div>
      ) : goals.length === 0 ? (
        <div className="text-text-secondary text-sm">No projects found.</div>
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
