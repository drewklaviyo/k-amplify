"use client";

import { useEffect, useState, memo } from "react";
import { useLayout } from "@/components/layout-context";
import { HealthBadge } from "@/components/health-badge";
import { MetricsSkeleton, TableSkeleton } from "@/components/skeleton";
import Link from "next/link";
import type { HealthStatus, OrgSlug } from "@/lib/types";

interface TopLine {
  hoursSavedYTD: number;
  hoursSavedTarget: number;
  arrPerHC: number;
  arrPerHCTarget: number;
  hcAvoided: number;
  hcAvoidedTarget: number;
  agentAutonomyRate: number;
  agentAutonomyTarget: number;
}

interface OrgScore {
  slug: OrgSlug;
  label: string;
  pmOwner: string;
  goalName: string;
  health: HealthStatus;
  activeProjects: number;
  shippedProjects: number;
  hoursSaved: number;
  hoursTarget: number;
  keyMetricLabel: string;
  keyMetricValue: string;
  keyMetricTarget: string;
  adoptionLabel: string;
  adoptionValue: string;
  adoptionTarget: string;
}

interface RiskItem {
  projectName: string;
  orgSlug: OrgSlug;
  health: HealthStatus;
  summary: string;
  date: string;
}

interface HygieneStats {
  slug: OrgSlug;
  label: string;
  pmOwner: string;
  totalProjects: number;
  missingHealth: number;
  staleUpdates: number;
  demosThisMonth: number;
  shippedMissingDescription: number;
}

interface ScoreboardData {
  lastUpdated: string;
  topLine: TopLine;
  weightedValueM?: number;
  weightedTargetM?: number;
  orgs: OrgScore[];
  risks: RiskItem[];
  hygiene?: HygieneStats[];
}

function pct(value: number, target: number): number {
  if (target === 0) return 0;
  return Math.round((value / target) * 100);
}

function paceStatus(value: number, target: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  const p = pct(value, target);
  const monthsElapsed = new Date().getMonth() + 1;
  const expectedPct = Math.round((monthsElapsed / 12) * 100);
  if (p >= expectedPct - 5)
    return { label: "On Pace", color: "text-green", bgColor: "bg-green" };
  if (p >= expectedPct - 15)
    return { label: "Slightly Behind", color: "text-orange", bgColor: "bg-orange" };
  return { label: "Behind Pace", color: "text-red", bgColor: "bg-red" };
}

/* Donut chart SVG for hero metrics */
const DonutChart = memo(function DonutChart({
  value,
  target,
  color,
  size = 56,
}: {
  value: number;
  target: number;
  color: string;
  size?: number;
}) {
  const p = Math.min(pct(value, target), 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (p / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 -rotate-90">
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke="var(--color-surface-2)"
        strokeWidth="10"
      />
      <circle
        cx="50" cy="50" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="donut-ring"
        style={{ "--donut-target": offset } as React.CSSProperties}
      />
    </svg>
  );
});

function ProgressBar({
  value,
  target,
  color = "bg-accent",
}: {
  value: number;
  target: number;
  color?: string;
}) {
  const p = Math.min(pct(value, target), 100);
  return (
    <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden mt-1">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

export default function ScoreboardPage() {
  const [data, setData] = useState<ScoreboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { setWide } = useLayout();

  useEffect(() => {
    fetch("/api/scoreboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Widen layout for scoreboard tables
  useEffect(() => {
    setWide(true);
    return () => { setWide(false); };
  }, [setWide]);

  if (loading) {
    return (
      <div className="pt-10 animate-in">
        <h1 className="text-xl font-bold tracking-tight mb-1">Scoreboard</h1>
        <p className="text-text-secondary text-sm mb-8">
          Is Amplify on track to deliver its hours saved target this year?
        </p>
        <MetricsSkeleton />
        <div className="skeleton h-3 w-32 mb-3" />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pt-10 animate-in">
        <h1 className="text-xl font-bold tracking-tight mb-1">Scoreboard</h1>
        <div className="rounded-xl border border-red/20 bg-red/5 p-8 mt-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red/10 mb-4">
            <svg className="w-6 h-6 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-red text-sm font-medium mb-1">Failed to load scoreboard data</p>
          <p className="text-text-secondary/60 text-xs">Check your connection and try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { topLine, orgs, risks } = data;
  const hoursPace = paceStatus(topLine.hoursSavedYTD, topLine.hoursSavedTarget);
  // Compute estimated value: hours saved * $100/hr avg cost as a rough proxy
  const estimatedValueM = data.weightedValueM ?? 0;
  const targetValueM = data.weightedTargetM ?? 40;
  const totalActiveProjects = orgs.reduce((sum, o) => sum + o.activeProjects, 0);
  const totalShipped = orgs.reduce((sum, o) => sum + o.shippedProjects, 0);

  return (
    <div className="pt-10 animate-in">
      {/* Hero header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-surface via-surface to-surface-2 border border-border p-8 mb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-light/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Scoreboard</h1>
              <p className="text-text-secondary text-sm">
                Is Amplify on track to deliver ${Math.round(targetValueM)}M in value this year?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[0.68rem] text-text-secondary bg-bg/50 px-2.5 py-1 rounded-lg border border-border flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                Linear: Live
              </span>
              <span className="text-[0.68rem] text-text-secondary bg-bg/50 px-2.5 py-1 rounded-lg border border-border">
                Hours: Manual entry
              </span>
            </div>
          </div>
          <div className="flex items-end gap-8 flex-wrap">
            <div>
              <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-1">Est. Value Delivered YTD</div>
              <div className="text-4xl font-extrabold tracking-tight tabular-nums animate-count text-gradient">
                ${estimatedValueM.toFixed(1)}M
              </div>
            </div>
            <div className="flex gap-6 pb-1">
              <div className="text-center">
                <div className="text-lg font-bold tabular-nums">{totalActiveProjects}</div>
                <div className="text-[0.65rem] text-text-secondary font-medium">Active</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold tabular-nums text-green">{totalShipped}</div>
                <div className="text-[0.65rem] text-text-secondary font-medium">Shipped</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold tabular-nums">{orgs.length}</div>
                <div className="text-[0.65rem] text-text-secondary font-medium">Orgs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top-line metrics with donut charts */}
      <div id="top-line" className="relative" style={{ scrollMarginTop: 70 }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10 stagger-in">
        {/* Hours Saved */}
        <div className="bg-surface border border-border rounded-xl p-5 hover:border-border/80 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide">
              Hours Saved YTD
            </div>
            <DonutChart value={topLine.hoursSavedYTD} target={topLine.hoursSavedTarget} color="var(--color-accent)" />
          </div>
          <div className="text-2xl font-bold tracking-tight tabular-nums animate-count">
            {(topLine.hoursSavedYTD / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-text-secondary mb-1">
            of {(topLine.hoursSavedTarget / 1000).toFixed(0)}K target
          </div>
          <div
            className={`text-[0.68rem] font-medium mt-1 ${hoursPace.color}`}
          >
            {hoursPace.label}{" "}
            ({pct(topLine.hoursSavedYTD, topLine.hoursSavedTarget)}%)
          </div>
        </div>

        {/* ARR/HC — sample data */}
        <div className="bg-surface border border-border rounded-xl p-5 hover:border-border/80 transition-colors opacity-50">
          <div className="flex items-start justify-between mb-3">
            <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide">
              ARR / HC
            </div>
            <DonutChart value={topLine.arrPerHC} target={topLine.arrPerHCTarget} color="var(--color-green)" />
          </div>
          <div className="text-2xl font-bold tracking-tight tabular-nums animate-count">
            ${(topLine.arrPerHC / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-text-secondary mb-1">
            target ${(topLine.arrPerHCTarget / 1000).toFixed(0)}K
          </div>
          <div
            className={`text-[0.68rem] font-medium mt-1 ${paceStatus(topLine.arrPerHC, topLine.arrPerHCTarget).color}`}
          >
            {pct(topLine.arrPerHC, topLine.arrPerHCTarget)}% of target
          </div>
        </div>

        {/* HC Avoided */}
        <div className="bg-surface border border-border rounded-xl p-5 hover:border-border/80 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide">
              HC Avoided
            </div>
            <DonutChart value={topLine.hcAvoided} target={topLine.hcAvoidedTarget} color="var(--color-blue)" />
          </div>
          <div className="text-2xl font-bold tracking-tight tabular-nums animate-count">
            {topLine.hcAvoided}
          </div>
          <div className="text-xs text-text-secondary mb-1">
            of {topLine.hcAvoidedTarget} target hires
          </div>
          <div className="text-[0.68rem] font-medium mt-1 text-text-secondary">
            {pct(topLine.hcAvoided, topLine.hcAvoidedTarget)}% of target
          </div>
        </div>

        {/* Agent Autonomy - North Star — sample data */}
        <div className="bg-surface border border-accent/20 rounded-xl p-5 relative overflow-hidden glow-card opacity-50">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/8 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[0.65rem] font-semibold text-accent-light uppercase tracking-wide flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Agent Autonomy
              </div>
              <DonutChart value={topLine.agentAutonomyRate} target={topLine.agentAutonomyTarget} color="var(--color-accent-light)" />
            </div>
            <div className="text-2xl font-bold tracking-tight tabular-nums animate-count">
              {Math.round(topLine.agentAutonomyRate * 100)}%
            </div>
            <div className="text-xs text-text-secondary mb-1">
              target {Math.round(topLine.agentAutonomyTarget * 100)}% EOY
            </div>
            <div className="text-[0.68rem] font-medium mt-1 text-accent-light">
              North Star Metric
            </div>
          </div>
        </div>
      </div>

      {/* Per-org breakdown */}
      <h2 id="per-org" className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3" style={{ scrollMarginTop: 70 }}>
        Per-Org Breakdown
      </h2>

      <div className="table-wrap border border-border rounded-xl overflow-hidden mb-10 shadow-lg shadow-black/10">
        <table className="w-full text-[0.82rem]">
          <thead className="bg-surface-2">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                Org
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                Health
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                Hours Saved
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                Key Metric
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                Adoption
              </th>
              <th className="text-right px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                Projects
              </th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr
                key={org.slug}
                className="border-t border-border hover:bg-surface-2/30 transition-colors even:bg-surface-2/10"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/roadmap?team=${org.slug}`}
                    className="font-semibold hover:text-accent-light transition-colors"
                  >
                    {org.label}
                  </Link>
                  <div className="text-[0.7rem] text-text-secondary">
                    {org.pmOwner}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <HealthBadge status={org.health} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium tabular-nums">
                    {(org.hoursSaved / 1000).toFixed(0)}K{" "}
                    <span className="text-text-secondary font-normal">
                      / {(org.hoursTarget / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <ProgressBar value={org.hoursSaved} target={org.hoursTarget} />
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  <div className="font-medium">--</div>
                  <div className="text-[0.7rem] text-text-secondary/60">
                    {org.keyMetricLabel}
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  <div className="font-medium">--</div>
                  <div className="text-[0.7rem] text-text-secondary/60">
                    {org.adoptionLabel}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-medium tabular-nums">{org.activeProjects} active</div>
                  <div className="text-[0.7rem] text-text-secondary tabular-nums">
                    {org.shippedProjects} shipped
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Risk Watch List */}
      {risks.length > 0 && (
        <>
          <div id="risks" className="flex items-center gap-3 mb-3" style={{ scrollMarginTop: 70 }}>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Risk Watch List
            </h2>
            <span className="text-[10px] text-red bg-red/10 border border-red/20 px-2 py-0.5 rounded-md font-medium">
              {risks.length}
            </span>
          </div>
          <div className="space-y-2 mb-10">
            {risks.map((risk, i) => (
              <div
                key={i}
                className={`bg-surface border rounded-xl p-4 flex items-start gap-3 hover:border-border/80 transition-colors relative overflow-hidden ${
                  risk.health === "offTrack" ? "border-red/25" : "border-orange/25"
                }`}
              >
                <div className={`absolute left-0 top-0 w-1 h-full ${
                  risk.health === "offTrack" ? "bg-red" : "bg-orange"
                }`} />
                <HealthBadge status={risk.health} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[0.88rem]">
                    {risk.projectName}
                  </div>
                  {risk.summary && (
                    <p className="text-text-secondary text-[0.8rem] mt-0.5 line-clamp-2">
                      {risk.summary}
                    </p>
                  )}
                </div>
                <span className="text-[0.68rem] text-text-secondary bg-surface-2 px-2 py-0.5 rounded-lg shrink-0 border border-border">
                  {new Date(risk.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Linear Hygiene */}
      {data.hygiene && data.hygiene.length > 0 && (
        <>
          <div id="hygiene" className="flex items-center gap-3 mb-3" style={{ scrollMarginTop: 70 }}>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              Linear Hygiene
            </h2>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-text-secondary text-[0.78rem] mb-4">
            Keep Linear data fresh so K Amplify stays useful. Post weekly project updates, set health status, and link Loom demos.
          </p>
          <div className="table-wrap border border-border rounded-xl overflow-hidden mb-10 shadow-lg shadow-black/10">
            <table className="w-full text-[0.82rem]">
              <thead className="bg-surface-2">
                <tr>
                  <th className="text-left px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                    PM
                  </th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                    Projects
                  </th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                    Missing Health
                  </th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                    Stale (14d+)
                  </th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                    Demos This Month
                  </th>
                  <th className="text-center px-4 py-2.5 font-semibold text-[0.7rem] uppercase tracking-wide text-text-secondary">
                    Shipped Missing Desc.
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.hygiene.map((h) => {
                  return (
                    <tr
                      key={h.slug}
                      className="border-t border-border hover:bg-surface-2/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold">{h.pmOwner}</div>
                        <div className="text-[0.7rem] text-text-secondary">{h.label}</div>
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums">{h.totalProjects}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={h.missingHealth > 0 ? "text-orange font-semibold tabular-nums" : "text-green"}>
                          {h.missingHealth > 0 ? h.missingHealth : "\u2713"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={h.staleUpdates > 0 ? "text-orange font-semibold tabular-nums" : "text-green"}>
                          {h.staleUpdates > 0 ? h.staleUpdates : "\u2713"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={h.demosThisMonth === 0 ? "text-text-secondary" : "text-green font-semibold tabular-nums"}>
                          {h.demosThisMonth}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={h.shippedMissingDescription > 0 ? "text-orange font-semibold tabular-nums" : "text-green"}>
                          {h.shippedMissingDescription > 0 ? h.shippedMissingDescription : "\u2713"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Data sources footer */}
      <div className="bg-surface-2/50 border border-border rounded-xl p-5 text-[0.78rem] text-text-secondary">
        <div className="font-semibold text-text mb-2 text-xs uppercase tracking-wide">Data Sources</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <strong className="text-text">Linear (live):</strong> Goal health, project counts,
            risk watch list, shipped counts
          </div>
          <div>
            <strong className="text-text">Manual (admin):</strong> Hours saved per team,
            $$$ delivered, HC avoided
          </div>
        </div>
        <p className="mt-3 text-[0.72rem] text-text-secondary/60">
          Hours are entered weekly per team in the admin panel. Key Metric and Adoption columns will be connected in a future update.
        </p>
      </div>
    </div>
  );
}
