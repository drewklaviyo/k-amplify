"use client";

import { useEffect, useState } from "react";
import { HealthBadge } from "@/components/health-badge";
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
} {
  const p = pct(value, target);
  // We're ~25% through the year (Q1), so 25% pace is on track
  const monthsElapsed = new Date().getMonth() + 1; // rough
  const expectedPct = Math.round((monthsElapsed / 12) * 100);
  if (p >= expectedPct - 5)
    return { label: "On Pace", color: "text-green" };
  if (p >= expectedPct - 15)
    return { label: "Slightly Behind", color: "text-orange" };
  return { label: "Behind Pace", color: "text-red" };
}

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
        className={`h-full rounded-full ${color}`}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

export default function ScoreboardPage() {
  const [data, setData] = useState<ScoreboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/scoreboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="pt-10">
        <p className="text-text-secondary text-sm">Loading scoreboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pt-10">
        <p className="text-red text-sm">Failed to load scoreboard data.</p>
      </div>
    );
  }

  const { topLine, orgs, risks } = data;

  return (
    <div className="pt-10">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold tracking-tight">Scoreboard</h1>
        <div className="flex items-center gap-2">
          <span className="text-[0.68rem] text-text-secondary bg-surface-2 px-2 py-0.5 rounded border border-border">
            Linear: Live
          </span>
          <span className="text-[0.68rem] text-text-secondary bg-surface-2 px-2 py-0.5 rounded border border-border">
            Snowflake: {data.lastUpdated}
          </span>
        </div>
      </div>
      <p className="text-text-secondary text-sm mb-8">
        Is Amplify on track to deliver $66M in value this year?
      </p>

      {/* Top-line metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        {/* Hours Saved */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Hours Saved YTD
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {(topLine.hoursSavedYTD / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-text-secondary">
            of {(topLine.hoursSavedTarget / 1000).toFixed(0)}K target
          </div>
          <ProgressBar value={topLine.hoursSavedYTD} target={topLine.hoursSavedTarget} />
          <div
            className={`text-[0.68rem] font-medium mt-1.5 ${paceStatus(topLine.hoursSavedYTD, topLine.hoursSavedTarget).color}`}
          >
            {paceStatus(topLine.hoursSavedYTD, topLine.hoursSavedTarget).label}{" "}
            ({pct(topLine.hoursSavedYTD, topLine.hoursSavedTarget)}%)
          </div>
        </div>

        {/* ARR/HC */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-2">
            ARR / HC
          </div>
          <div className="text-2xl font-bold tracking-tight">
            ${(topLine.arrPerHC / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-text-secondary">
            target ${(topLine.arrPerHCTarget / 1000).toFixed(0)}K
          </div>
          <ProgressBar value={topLine.arrPerHC} target={topLine.arrPerHCTarget} />
          <div
            className={`text-[0.68rem] font-medium mt-1.5 ${paceStatus(topLine.arrPerHC, topLine.arrPerHCTarget).color}`}
          >
            {pct(topLine.arrPerHC, topLine.arrPerHCTarget)}% of target
          </div>
        </div>

        {/* HC Avoided */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-2">
            HC Avoided
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {topLine.hcAvoided}
          </div>
          <div className="text-xs text-text-secondary">
            of {topLine.hcAvoidedTarget} target hires
          </div>
          <ProgressBar value={topLine.hcAvoided} target={topLine.hcAvoidedTarget} />
          <div className="text-[0.68rem] font-medium mt-1.5 text-text-secondary">
            {pct(topLine.hcAvoided, topLine.hcAvoidedTarget)}% of target
          </div>
        </div>

        {/* Agent Autonomy */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Agent Autonomy Rate
          </div>
          <div className="text-2xl font-bold tracking-tight">
            {Math.round(topLine.agentAutonomyRate * 100)}%
          </div>
          <div className="text-xs text-text-secondary">
            target {Math.round(topLine.agentAutonomyTarget * 100)}% EOY
          </div>
          <ProgressBar
            value={topLine.agentAutonomyRate}
            target={topLine.agentAutonomyTarget}
            color="bg-accent-light"
          />
          <div className="text-[0.68rem] font-medium mt-1.5 text-accent-light">
            North Star Metric
          </div>
        </div>
      </div>

      {/* Per-org breakdown */}
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Per-Org Breakdown
      </h2>

      <div className="table-wrap border border-border rounded-xl overflow-hidden mb-10">
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
                className="border-t border-border hover:bg-surface-2/30 transition-colors"
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
                  <div className="font-medium">
                    {(org.hoursSaved / 1000).toFixed(0)}K{" "}
                    <span className="text-text-secondary font-normal">
                      / {(org.hoursTarget / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <ProgressBar value={org.hoursSaved} target={org.hoursTarget} />
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{org.keyMetricValue}</div>
                  <div className="text-[0.7rem] text-text-secondary">
                    {org.keyMetricLabel} (target: {org.keyMetricTarget})
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{org.adoptionValue}</div>
                  <div className="text-[0.7rem] text-text-secondary">
                    {org.adoptionLabel} (target: {org.adoptionTarget})
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-medium">{org.activeProjects} active</div>
                  <div className="text-[0.7rem] text-text-secondary">
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
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Risk Watch List
          </h2>
          <div className="space-y-2 mb-10">
            {risks.map((risk, i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3"
              >
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
                <span className="text-[0.68rem] text-text-secondary bg-surface-2 px-2 py-0.5 rounded shrink-0">
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
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
            Linear Hygiene
          </h2>
          <p className="text-text-secondary text-[0.78rem] mb-4">
            Keep Linear data fresh so K Amplify stays useful. Post weekly project updates, set health status, and link Loom demos.
          </p>
          <div className="table-wrap border border-border rounded-xl overflow-hidden mb-10">
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
                  const issues = h.missingHealth + h.staleUpdates + (h.demosThisMonth === 0 ? 1 : 0) + h.shippedMissingDescription;
                  return (
                    <tr
                      key={h.slug}
                      className="border-t border-border hover:bg-surface-2/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold">{h.pmOwner}</div>
                        <div className="text-[0.7rem] text-text-secondary">{h.label}</div>
                      </td>
                      <td className="px-4 py-3 text-center">{h.totalProjects}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={h.missingHealth > 0 ? "text-orange font-semibold" : "text-green"}>
                          {h.missingHealth > 0 ? h.missingHealth : "\u2713"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={h.staleUpdates > 0 ? "text-orange font-semibold" : "text-green"}>
                          {h.staleUpdates > 0 ? h.staleUpdates : "\u2713"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={h.demosThisMonth === 0 ? "text-text-secondary" : "text-green font-semibold"}>
                          {h.demosThisMonth}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={h.shippedMissingDescription > 0 ? "text-orange font-semibold" : "text-green"}>
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
      <div className="bg-surface-2 border border-border rounded-xl p-4 text-[0.78rem] text-text-secondary">
        <div className="font-semibold text-text mb-1">Data Sources</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>Linear (live):</strong> Goal health, project counts,
            risk watch list, shipped counts
          </div>
          <div>
            <strong>Snowflake:</strong> Hours saved, ARR/HC, HC avoided,
            agent autonomy, business metrics, adoption
          </div>
        </div>
        <p className="mt-2 text-[0.72rem]">
          Snowflake metrics update from <code className="text-[0.72rem] bg-surface px-1 py-0.5 rounded">lib/scoreboard-data.json</code> until
          the Snowflake API integration is connected.
        </p>
      </div>
    </div>
  );
}
