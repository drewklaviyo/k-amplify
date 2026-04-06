"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import type { GoalSummary, ProjectSummary, OrgSlug, HealthStatus } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";
import { HealthBadge } from "./health-badge";
import { ProjectDetailPanel } from "./project-detail-panel";

type ZoomLevel = "quarter" | "month" | "week";

const ZOOM_CONFIG: Record<ZoomLevel, { columnWidth: number; label: string }> = {
  quarter: { columnWidth: 180, label: "Quarter" },
  month: { columnWidth: 260, label: "Month" },
  week: { columnWidth: 380, label: "Week" },
};

const ORG_COLORS: Record<OrgSlug, string> = {
  sales: "#6c5ce7",
  demos: "#a29bfe",
  support: "#00b894",
  cs: "#74b9ff",
  rnd: "#fdcb6e",
  marketing: "#e17055",
};

const HEALTH_SORT_PRIORITY: Record<HealthStatus, number> = {
  offTrack: 0,
  atRisk: 1,
  onTrack: 2,
  none: 3,
};

const HEALTH_DOT_CLASS: Record<HealthStatus, string> = {
  onTrack: "bg-green",
  atRisk: "bg-orange",
  offTrack: "bg-red",
  none: "bg-text-secondary/40",
};

interface MilestoneMarker {
  milestoneId: string;
  milestoneName: string;
  milestoneDate: string;
  project: ProjectSummary;
}

interface MonthBucket {
  key: string; // "2026-04"
  label: string; // "Apr 2026"
  shortLabel: string; // "Apr"
  quarter: string; // "Q2 2026"
  year: number;
  month: number; // 0-indexed
  isCurrent: boolean;
  projects: ProjectSummary[];
  milestones: MilestoneMarker[];
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "2026-04-15" -> "2026-04"
}

function formatLead(lead: string | null): string {
  if (!lead) return "Unassigned";
  // Handle email-like leads: "jay.chiruvolu" -> "Jay C."
  const parts = lead.split(/[@.\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const lastInitial = parts[1].charAt(0).toUpperCase() + ".";
    return `${first} ${lastInitial}`;
  }
  return parts[0]?.charAt(0).toUpperCase() + (parts[0]?.slice(1) ?? "");
}

function sortProjects(projects: ProjectSummary[]): ProjectSummary[] {
  return [...projects].sort((a, b) => {
    const ha = HEALTH_SORT_PRIORITY[a.health];
    const hb = HEALTH_SORT_PRIORITY[b.health];
    if (ha !== hb) return ha - hb;
    return b.progress - a.progress;
  });
}

function ProjectCard({
  project,
  zoom,
  onClick,
}: {
  project: ProjectSummary;
  zoom: ZoomLevel;
  onClick: () => void;
}) {
  const orgConfig = ORG_BY_SLUG[project.orgSlug];
  const orgColor = ORG_COLORS[project.orgSlug];
  const barColor = project.status.color || orgColor;
  const healthDot = HEALTH_DOT_CLASS[project.health];
  const isCompact = zoom === "quarter";

  const targetLabel = project.targetDate
    ? new Date(project.targetDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface border border-border rounded-lg hover:border-accent/30 transition-all cursor-pointer group"
      style={{ borderLeftWidth: 3, borderLeftColor: barColor }}
    >
      <div className={isCompact ? "px-2.5 py-2" : "px-3 py-2.5"}>
        {/* Row 1: Health dot + name */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${healthDot}`} />
          <span
            className={`font-medium truncate ${
              isCompact ? "text-xs" : "text-sm"
            }`}
          >
            {project.name}
          </span>
        </div>

        {isCompact ? (
          /* Compact: just org label */
          <div className="mt-0.5 ml-3.5">
            <span
              className="text-[10px] font-medium"
              style={{ color: orgColor }}
            >
              {orgConfig?.label ?? project.orgSlug}
            </span>
          </div>
        ) : (
          <>
            {/* Row 2: Org + Lead */}
            <div className="flex items-center gap-1.5 mt-1 ml-3.5 text-xs text-text-secondary">
              <span className="font-medium" style={{ color: orgColor }}>
                {orgConfig?.label ?? project.orgSlug}
              </span>
              <span className="text-border">·</span>
              <span className="truncate">{formatLead(project.lead)}</span>
            </div>

            {/* Row 3: Progress bar */}
            <div className="flex items-center gap-2 mt-2 ml-3.5">
              <div className="flex-1 h-1.5 rounded-full bg-bg overflow-hidden border border-border/50">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round(project.progress * 100)}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
              <span className="text-[10px] text-text-secondary tabular-nums font-medium shrink-0">
                {Math.round(project.progress * 100)}%
              </span>
            </div>

            {/* Row 4: Target date */}
            {targetLabel && (
              <div className="mt-1.5 ml-3.5">
                <span className="text-[10px] text-text-secondary">
                  Target: {targetLabel}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
}

function MilestoneCard({
  milestone,
  zoom,
  onClick,
}: {
  milestone: MilestoneMarker;
  zoom: ZoomLevel;
  onClick: () => void;
}) {
  const orgColor = ORG_COLORS[milestone.project.orgSlug];
  const isCompact = zoom === "quarter";
  const dateLabel = new Date(milestone.milestoneDate + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-accent/5 border border-accent/20 rounded-lg p-2.5 hover:border-accent/40 hover:bg-accent/10 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Accent left border */}
      <div
        className="absolute left-0 top-0 w-1 h-full rounded-l-lg"
        style={{ backgroundColor: orgColor }}
      />

      {/* Diamond + milestone name */}
      <div className="flex items-start gap-2 ml-1.5">
        <span className="text-accent-light text-xs mt-0.5 shrink-0">◇</span>
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-accent-light/90 truncate ${isCompact ? "text-[11px]" : "text-xs"}`}>
            {milestone.milestoneName}
          </p>
          {!isCompact && (
            <>
              <p className="text-[10px] text-text-secondary/60 truncate mt-0.5">
                {milestone.project.name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-accent-light/60">
                  {dateLabel}
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: orgColor + "1F",
                    color: orgColor,
                  }}
                >
                  {ORG_BY_SLUG[milestone.project.orgSlug]?.label}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

export function RoadmapGrid({ goals }: { goals: GoalSummary[] }) {
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [showBacklog, setShowBacklog] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const allProjects = useMemo(
    () => goals.flatMap((g) => g.projects),
    [goals],
  );

  // Build month buckets
  const { monthBuckets, backlogProjects, undatedProjects } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Collect all projects by month key
    const byMonth = new Map<string, ProjectSummary[]>();
    const milestonesByMonth = new Map<string, MilestoneMarker[]>();
    const backlog: ProjectSummary[] = []; // Status = "Backlog" — hidden by default
    const undated: ProjectSummary[] = []; // No date but not Backlog status — always visible

    for (const p of allProjects) {
      if (p.targetDate) {
        const key = getMonthKey(p.targetDate);
        if (!byMonth.has(key)) byMonth.set(key, []);
        byMonth.get(key)!.push(p);
      } else if (p.status.name.toLowerCase() === "backlog") {
        backlog.push(p);
      } else {
        undated.push(p);
      }

      // Place milestones in their target month (if different from the project's month)
      const projectMonthKey = p.targetDate ? getMonthKey(p.targetDate) : null;
      for (const ms of p.milestones) {
        if (!ms.targetDate) continue;
        const msMonthKey = getMonthKey(ms.targetDate);
        // Only show milestone marker if it's in a DIFFERENT month than the project
        if (msMonthKey === projectMonthKey) continue;
        if (!milestonesByMonth.has(msMonthKey)) milestonesByMonth.set(msMonthKey, []);
        milestonesByMonth.get(msMonthKey)!.push({
          milestoneId: ms.id,
          milestoneName: ms.name,
          milestoneDate: ms.targetDate,
          project: p,
        });
      }
    }

    // Determine range: from 2 months ago to the latest project month + 2, or at least 6 months out
    let minYear = currentYear;
    let minMonth = currentMonth - 2;
    let maxYear = currentYear;
    let maxMonth = currentMonth + 6;

    for (const key of byMonth.keys()) {
      const [y, m] = key.split("-").map(Number);
      const monthIdx = y * 12 + (m - 1);
      const minIdx = minYear * 12 + minMonth;
      const maxIdx = maxYear * 12 + maxMonth;
      if (monthIdx < minIdx) {
        minYear = y;
        minMonth = m - 1;
      }
      if (monthIdx > maxIdx) {
        maxYear = y;
        maxMonth = m - 1;
      }
    }

    // Normalize
    while (minMonth < 0) {
      minMonth += 12;
      minYear--;
    }
    while (maxMonth > 11) {
      maxMonth -= 12;
      maxYear++;
    }

    const buckets: MonthBucket[] = [];
    let y = minYear;
    let m = minMonth;
    const endIdx = maxYear * 12 + maxMonth;

    while (y * 12 + m <= endIdx) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const date = new Date(y, m, 1);
      const q = Math.floor(m / 3) + 1;
      // Sort milestones by date
      const monthMilestones = (milestonesByMonth.get(key) ?? []).sort(
        (a, b) => a.milestoneDate.localeCompare(b.milestoneDate),
      );

      buckets.push({
        key,
        label: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        shortLabel: date.toLocaleDateString("en-US", { month: "short" }),
        quarter: `Q${q} ${y}`,
        year: y,
        month: m,
        isCurrent: y === currentYear && m === currentMonth,
        projects: sortProjects(byMonth.get(key) ?? []),
        milestones: monthMilestones,
      });

      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }

    return { monthBuckets: buckets, backlogProjects: sortProjects(backlog), undatedProjects: sortProjects(undated) };
  }, [allProjects]);

  // Group month buckets by quarter for rendering quarter headers
  const quarterGroups = useMemo(() => {
    const groups: { quarter: string; months: MonthBucket[] }[] = [];
    let current: { quarter: string; months: MonthBucket[] } | null = null;

    for (const bucket of monthBuckets) {
      if (!current || current.quarter !== bucket.quarter) {
        current = { quarter: bucket.quarter, months: [] };
        groups.push(current);
      }
      current.months.push(bucket);
    }

    return groups;
  }, [monthBuckets]);

  // Auto-scroll to current month on mount and zoom change
  useEffect(() => {
    if (!scrollRef.current) return;
    const currentIdx = monthBuckets.findIndex((b) => b.isCurrent);
    if (currentIdx < 0) return;

    const colWidth = ZOOM_CONFIG[zoom].columnWidth;
    // Each column also has 12px gap. Estimate offset.
    const offset = currentIdx * (colWidth + 12);
    const containerWidth = scrollRef.current.clientWidth;
    const scrollTarget = offset - containerWidth / 4;

    scrollRef.current.scrollTo({
      left: Math.max(0, scrollTarget),
      behavior: "smooth",
    });
  }, [zoom, monthBuckets]);

  // Keyboard scrolling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        el.scrollBy({ left: 200, behavior: "smooth" });
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") {
        el.scrollBy({ left: -200, behavior: "smooth" });
        e.preventDefault();
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCardClick = useCallback((id: string) => {
    setSelectedProjectId(id);
  }, []);

  const colWidth = ZOOM_CONFIG[zoom].columnWidth;
  const totalProjects = allProjects.length;
  const datedCount = totalProjects - backlogProjects.length - undatedProjects.length;

  return (
    <div className="relative animate-in">
      {/* Zoom controls + stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-accent/60" />
            {datedCount} with dates
          </span>
          {undatedProjects.length > 0 && (
            <>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-orange/60" />
                {undatedProjects.length} no date
              </span>
            </>
          )}
          {backlogProjects.length > 0 && (
            <>
              <span className="text-border">|</span>
              <button
                onClick={() => setShowBacklog(!showBacklog)}
                className={`flex items-center gap-1.5 transition-colors ${showBacklog ? "text-text" : "text-text-secondary hover:text-text"}`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-surface-2 border border-border" />
                {backlogProjects.length} backlog
                <span className="text-[10px]">{showBacklog ? "▾" : "▸"}</span>
              </button>
            </>
          )}
        </div>
        <div className="flex gap-0.5 bg-surface border border-border rounded-xl p-1">
          {(["quarter", "month", "week"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setZoom(level)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                zoom === level
                  ? "bg-accent/15 text-accent-light shadow-sm border border-accent/20"
                  : "text-text-secondary hover:text-text border border-transparent"
              }`}
            >
              {ZOOM_CONFIG[level].label}
            </button>
          ))}
        </div>
      </div>

      {totalProjects === 0 ? (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
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
        <div
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label="Roadmap grid -- use arrow keys to scroll horizontally"
          className="overflow-x-auto pb-4 timeline-scroll focus:outline-none"
        >
          {/* Quarter headers */}
          <div className="flex gap-0" style={{ minWidth: "max-content" }}>
            {quarterGroups.map((qg) => {
              const qWidth =
                qg.months.length * colWidth +
                (qg.months.length - 1) * 12;
              return (
                <div
                  key={qg.quarter}
                  className="shrink-0 mr-3 last:mr-0"
                  style={{ width: qWidth }}
                >
                  <div className="text-xs uppercase tracking-wider text-text-secondary font-medium px-1 pb-1.5">
                    {qg.quarter}
                  </div>
                </div>
              );
            })}
            {/* Backlog quarter spacer */}
            {backlogProjects.length > 0 && (
              <div className="shrink-0 ml-3" style={{ width: colWidth }}>
                <div className="text-xs uppercase tracking-wider text-text-secondary font-medium px-1 pb-1.5">
                  &nbsp;
                </div>
              </div>
            )}
          </div>

          {/* Month columns */}
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {monthBuckets.map((bucket) => (
              <div
                key={bucket.key}
                className={`shrink-0 rounded-xl border ${
                  bucket.isCurrent
                    ? "border-accent/30 bg-accent/[0.03]"
                    : "border-border/50 bg-surface/30"
                }`}
                style={{ width: colWidth }}
              >
                {/* Month header */}
                <div
                  className={`px-3 py-2.5 border-b rounded-t-xl ${
                    bucket.isCurrent
                      ? "border-accent/20 bg-accent/10"
                      : "border-border/50 bg-surface-2/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold ${
                        bucket.isCurrent ? "text-accent-light" : "text-text"
                      }`}
                    >
                      {bucket.label}
                    </span>
                    {(bucket.projects.length > 0 || bucket.milestones.length > 0) && (
                      <div className="flex items-center gap-1">
                        {bucket.projects.length > 0 && (
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                              bucket.isCurrent
                                ? "bg-accent/15 text-accent-light"
                                : "bg-bg text-text-secondary"
                            }`}
                          >
                            {bucket.projects.length}
                          </span>
                        )}
                        {bucket.milestones.length > 0 && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-accent/10 text-accent-light/70">
                            ◇{bucket.milestones.length}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[80px]">
                  {bucket.projects.length === 0 && bucket.milestones.length === 0 ? (
                    <div className="flex items-center justify-center h-16">
                      <span className="text-[11px] text-text-secondary/40">
                        No projects
                      </span>
                    </div>
                  ) : (
                    <>
                      {bucket.projects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          zoom={zoom}
                          onClick={() => handleCardClick(project.id)}
                        />
                      ))}
                      {bucket.milestones.map((ms) => (
                        <MilestoneCard
                          key={ms.milestoneId}
                          milestone={ms}
                          zoom={zoom}
                          onClick={() => handleCardClick(ms.project.id)}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* No Date column — always visible for undated non-backlog projects */}
            {(undatedProjects.length > 0 || (showBacklog && backlogProjects.length > 0)) && (
              <div
                className="shrink-0 rounded-xl border border-dashed border-border/50 bg-surface/20"
                style={{ width: colWidth }}
              >
                <div className="px-3 py-2.5 border-b border-border/50 bg-surface-2/20 rounded-t-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text-secondary">
                      No Date
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-orange/10 text-orange border border-orange/20">
                      {undatedProjects.length + (showBacklog ? backlogProjects.length : 0)}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-2">
                  {undatedProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      zoom={zoom}
                      onClick={() => handleCardClick(project.id)}
                    />
                  ))}
                  {showBacklog && backlogProjects.length > 0 && (
                    <>
                      {undatedProjects.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 pb-0.5">
                          <div className="flex-1 h-px bg-border/50" />
                          <span className="text-[9px] text-text-secondary/50 uppercase tracking-wider">Backlog</span>
                          <div className="flex-1 h-px bg-border/50" />
                        </div>
                      )}
                      {backlogProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          zoom={zoom}
                          onClick={() => handleCardClick(project.id)}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Project detail slide-out panel */}
      {selectedProjectId &&
        (() => {
          const selectedProject = allProjects.find(
            (p) => p.id === selectedProjectId,
          );
          if (!selectedProject) return null;
          const orgLabel =
            ORG_BY_SLUG[selectedProject.orgSlug]?.label ??
            selectedProject.orgSlug;
          return (
            <ProjectDetailPanel
              project={selectedProject}
              orgLabel={orgLabel}
              onClose={() => setSelectedProjectId(null)}
            />
          );
        })()}
    </div>
  );
}
