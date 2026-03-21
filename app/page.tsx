"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import { GoalSummary, ActivityItem, OrgSlug, InitiativeSlug } from "@/lib/types";
import { OrgCard } from "@/components/org-card";
import { GridSkeleton } from "@/components/skeleton";
import { ORG_BY_SLUG, INITIATIVE_LIST, ORG_CONFIGS } from "@/lib/config";
import { MountainViz } from "@/components/mountain-viz";
import { GoatWinners } from "@/components/goat-winners";
import Link from "next/link";

export default function HomePage() {
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [demoCounts, setDemoCounts] = useState<Record<OrgSlug, number> | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiativeFilter, setInitiativeFilter] = useState<InitiativeSlug | "all">("all");
  usePageTitle("Home");

  useEffect(() => {
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((roadmapData) => {
        setGoals(roadmapData.goals ?? []);
        setDemoCounts(roadmapData.demoCountByOrg ?? {});
        setActivity(roadmapData.recentActivity ?? []);
      })
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, []);

  // Compute summary stats
  const totalProjects = goals.reduce((sum, g) => sum + g.projects.length, 0);
  const onTrackCount = goals.filter((g) => g.health === "onTrack").length;
  const atRiskCount = goals.filter((g) => g.health === "atRisk").length;
  const offTrackCount = goals.filter((g) => g.health === "offTrack").length;

  // Filter goals by selected initiative
  const filteredGoals = initiativeFilter === "all"
    ? goals
    : goals.filter((g) => {
        const orgConfig = ORG_CONFIGS.find((c) => c.slug === g.orgSlug);
        return orgConfig?.initiatives.includes(initiativeFilter);
      });

  return (
    <div className="pt-10 animate-in">
      <div className="mb-8">
        <h1 className="text-[2.2rem] font-extrabold tracking-tight leading-tight mb-2 text-gradient">
          Base K:Amplify
        </h1>
        <p className="text-text-secondary text-[0.92rem] max-w-lg">
          Base Camp for Amplify&apos;s climb to 501K hours saved
        </p>
        {!loading && goals.length > 0 && (
          <p className="text-xs text-text-secondary mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            {onTrackCount} of {goals.length} orgs on track &middot; {totalProjects} active projects
          </p>
        )}
      </div>

      {loading ? (
        <div aria-live="polite" aria-busy="true">
          <GridSkeleton count={5} />
        </div>
      ) : (
        <>
          {/* Executive summary strip */}
          {goals.length > 0 && (
            <div className="flex items-center gap-2.5 mb-8 flex-wrap" role="status" aria-label="Portfolio summary">
              <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                <span className="text-[0.68rem] text-text-secondary font-medium uppercase tracking-wide">Orgs</span>
                <span className="text-sm font-bold tabular-nums animate-count">{goals.length}</span>
              </div>
              <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                <span className="text-[0.68rem] text-text-secondary font-medium uppercase tracking-wide">Projects</span>
                <span className="text-sm font-bold tabular-nums animate-count">{totalProjects}</span>
              </div>
              {onTrackCount > 0 && (
                <div className="flex items-center gap-2 bg-green/8 border border-green/20 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <span className="text-[0.68rem] text-green font-semibold">{onTrackCount} on track</span>
                </div>
              )}
              {atRiskCount > 0 && (
                <div className="flex items-center gap-2 bg-orange/8 border border-orange/20 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-orange" />
                  <span className="text-[0.68rem] text-orange font-semibold">{atRiskCount} at risk</span>
                </div>
              )}
              {offTrackCount > 0 && (
                <div className="flex items-center gap-2 bg-red/8 border border-red/20 rounded-lg px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-red" />
                  <span className="text-[0.68rem] text-red font-semibold">{offTrackCount} off track</span>
                </div>
              )}
            </div>
          )}

          {/* Mountain progress viz */}
          <MountainViz />

          {/* GOAT winners callout */}
          <GoatWinners />

          {/* Initiative filter tabs */}
          <div className="flex gap-1 flex-wrap mb-6" role="tablist" aria-label="Filter by initiative">
            <button
              onClick={() => setInitiativeFilter("all")}
              role="tab"
              aria-selected={initiativeFilter === "all"}
              className={`text-[0.78rem] font-medium px-3 py-1.5 rounded-lg transition-all border ${
                initiativeFilter === "all"
                  ? "text-accent-light bg-accent/12 border-accent/25 shadow-sm"
                  : "text-text-secondary bg-surface border-border hover:text-text hover:bg-surface-2"
              }`}
            >
              All
            </button>
            {INITIATIVE_LIST.map((init) => (
              <button
                key={init.slug}
                onClick={() => setInitiativeFilter(init.slug)}
                role="tab"
                aria-selected={initiativeFilter === init.slug}
                className="text-[0.78rem] font-medium px-3 py-1.5 rounded-lg transition-all border"
                style={
                  initiativeFilter === init.slug
                    ? {
                        color: init.color,
                        backgroundColor: `${init.color}1a`,
                        borderColor: `${init.color}40`,
                        boxShadow: `0 1px 2px ${init.color}15`,
                      }
                    : {
                        color: "var(--color-text-secondary)",
                        backgroundColor: "var(--color-surface)",
                        borderColor: "var(--color-border)",
                      }
                }
              >
                {init.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
            {filteredGoals.map((goal) => (
              <OrgCard
                key={goal.id}
                goal={goal}
                demoCount={demoCounts?.[goal.orgSlug] ?? 0}
              />
            ))}
          </div>

          {/* Activity feed */}
          {activity.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Recent Activity</h2>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-1">
                {activity.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-surface transition-colors group"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="relative shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        item.type === "shipped" ? "bg-green" : "bg-blue"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className={`text-[0.65rem] font-semibold uppercase tracking-wide shrink-0 ${
                        item.type === "shipped" ? "text-green" : "text-blue"
                      }`}>
                        {item.type === "shipped" ? "Shipped" : "Demo"}
                      </span>
                      <span className="text-sm truncate group-hover:text-text transition-colors">{item.title}</span>
                      <span className="text-[0.68rem] text-text-secondary bg-surface-2 px-1.5 py-0.5 rounded-md border border-border shrink-0">
                        {ORG_BY_SLUG[item.orgSlug]?.label}
                      </span>
                    </div>
                    <span className="text-[0.68rem] text-text-secondary/60 tabular-nums shrink-0">
                      {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <Link href="/shipped" className="text-xs text-text-secondary hover:text-accent-light transition-colors">
                  View all shipped &rarr;
                </Link>
                <Link href="/demos" className="text-xs text-text-secondary hover:text-accent-light transition-colors">
                  View all demos &rarr;
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
