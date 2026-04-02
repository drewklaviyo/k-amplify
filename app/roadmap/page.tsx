"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GoalSummary, OrgSlug } from "@/lib/types";
import { useLayout } from "@/components/layout-context";
import { OrgFilter } from "@/components/org-filter";
import { RoadmapGrid } from "@/components/roadmap-grid";
import { GridSkeleton } from "@/components/skeleton";

function RoadmapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTeam = (searchParams.get("team") as OrgSlug | null) ?? "all";

  const [filter, setFilter] = useState<OrgSlug | "all">(initialTeam);
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { setWide } = useLayout();

  // Update URL when filter changes
  const updateUrl = useCallback(
    (team: string) => {
      const params = new URLSearchParams();
      if (team !== "all") params.set("team", team);
      const qs = params.toString();
      router.replace(`/roadmap${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  const handleFilterChange = useCallback(
    (team: OrgSlug | "all") => {
      setFilter(team);
      updateUrl(team);
    },
    [updateUrl],
  );

  useEffect(() => {
    setLoading(true);
    const params = filter === "all" ? "" : `?team=${filter}`;
    fetch(`/api/roadmap${params}`)
      .then((r) => r.json())
      .then((data) => setGoals(data.goals ?? []))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, [filter]);

  // Always use wide layout for the grid view
  useEffect(() => {
    setWide(true);
    return () => {
      setWide(false);
    };
  }, [setWide]);

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <OrgFilter selected={filter} onChange={handleFilterChange} />
      </div>

      {loading ? (
        <GridSkeleton count={8} />
      ) : goals.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 mb-4">
            <svg
              className="w-6 h-6 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-text-secondary text-sm font-medium mb-1">
            No projects found
          </p>
          <p className="text-text-secondary/60 text-xs">
            Projects will appear here once they are added to Linear.
          </p>
        </div>
      ) : (
        <RoadmapGrid goals={goals} />
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
      <Suspense fallback={<GridSkeleton count={8} />}>
        <RoadmapContent />
      </Suspense>
    </div>
  );
}
