"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import { GoalSummary, ActivityItem, OrgSlug } from "@/lib/types";
import type { InitiativeUpdateData } from "@/app/api/initiatives/route";
import { OrgCard } from "@/components/org-card";
import { GridSkeleton } from "@/components/skeleton";
import { INITIATIVE_LIST, INITIATIVE_DETAILS, ORG_CONFIGS, ORG_BY_SLUG } from "@/lib/config";
import { MountainViz } from "@/components/mountain-viz";
import { GoatWinners } from "@/components/goat-winners";
import Link from "next/link";

export default function HomePage() {
  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [demoCounts, setDemoCounts] = useState<Record<OrgSlug, number> | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [initUpdates, setInitUpdates] = useState<Record<string, InitiativeUpdateData>>({});
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

    fetch("/api/initiatives")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, InitiativeUpdateData> = {};
        for (const u of d.initiatives ?? []) map[u.slug] = u;
        setInitUpdates(map);
      })
      .catch(() => {});
  }, []);

  // Compute summary stats
  const totalProjects = goals.reduce((sum, g) => sum + g.projects.length, 0);
  const onTrackCount = goals.filter((g) => g.health === "onTrack").length;
  const atRiskCount = goals.filter((g) => g.health === "atRisk").length;
  const offTrackCount = goals.filter((g) => g.health === "offTrack").length;

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

          {/* ── INITIATIVES ── */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Initiatives</h2>
              <div className="flex-1 h-px bg-border" />
              <Link href="/initiatives" className="text-xs text-text-secondary hover:text-accent-light transition-colors">
                View details &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {INITIATIVE_LIST.map((init) => {
                const details = INITIATIVE_DETAILS[init.slug];
                const orgs = ORG_CONFIGS.filter((c) => c.initiatives.includes(init.slug));
                const update = initUpdates[init.slug];
                const health = update?.latestUpdate?.health ?? update?.health;
                const healthColor = health === "onTrack" ? "bg-green" : health === "atRisk" ? "bg-orange" : health === "offTrack" ? "bg-red" : null;
                return (
                  <Link
                    key={init.slug}
                    href="/initiatives"
                    className="bg-surface border border-border rounded-xl overflow-hidden hover:border-border/60 transition-all group relative"
                  >
                    <div className="h-1" style={{ background: `linear-gradient(90deg, ${init.color}, ${init.color}88)` }} />
                    <div className="absolute top-0 left-0 right-0 h-16 opacity-[0.03] pointer-events-none" style={{ background: `linear-gradient(180deg, ${init.color}, transparent)` }} />
                    <div className="relative p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: init.color }} />
                        <span className="text-sm font-bold" style={{ color: init.color }}>{init.name}</span>
                        {healthColor && <div className={`w-2 h-2 rounded-full ${healthColor} ml-auto`} />}
                      </div>
                      <p className="text-[0.78rem] text-text-secondary mb-3">{details.goal}</p>
                      {update?.latestUpdate && (
                        <p className="text-[0.68rem] text-text-secondary/60 mb-2">
                          Updated {new Date(update.latestUpdate.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} by {update.latestUpdate.author}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex text-[0.7rem] font-semibold px-2 py-0.5 rounded-md border"
                          style={{ color: init.color, backgroundColor: `${init.color}14`, borderColor: `${init.color}25` }}
                        >
                          {details.targetMetric}
                        </span>
                        <div className="flex gap-1 ml-auto">
                          {orgs.map((org) => (
                            <span key={org.slug} className="text-[0.62rem] text-text-secondary bg-surface-2 px-1.5 py-0.5 rounded border border-border">
                              {org.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── TEAMS ── */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Teams</h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-secondary">{goals.length} orgs</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
            {goals.map((goal) => (
              <OrgCard
                key={goal.id}
                goal={goal}
                demoCount={demoCounts?.[goal.orgSlug] ?? 0}
              />
            ))}
            </div>
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
