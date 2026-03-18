"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { GoalSummary, ProjectSummary, OrgSlug } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";
import { TimelineBar } from "./timeline-bar";
import { HealthBadge } from "./health-badge";

type ZoomLevel = "quarter" | "month" | "week";

const ROW_HEIGHT = 68;
const GROUP_HEADER_HEIGHT = 44;
const HEADER_HEIGHT = 40;

const ORG_COLORS: Record<OrgSlug, string> = {
  sales: "#6c5ce7",
  support: "#00b894",
  cs: "#74b9ff",
  rnd: "#fdcb6e",
  marketing: "#e17055",
};

interface OrgGroup {
  orgSlug: OrgSlug;
  label: string;
  pmOwner: string;
  projects: ProjectSummary[];
  health: string;
}

export function RoadmapTimeline({ goals }: { goals: GoalSummary[] }) {
  const [zoom, setZoom] = useState<ZoomLevel>("month");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleGroup = useCallback((slug: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const allProjects = useMemo(() => goals.flatMap((g) => g.projects), [goals]);

  const { datedProjects, undatedProjects } = useMemo(() => {
    const dated: ProjectSummary[] = [];
    const undated: ProjectSummary[] = [];
    for (const p of allProjects) {
      if (p.startDate || p.targetDate) dated.push(p);
      else undated.push(p);
    }
    return { datedProjects: dated, undatedProjects: undated };
  }, [allProjects]);

  const groups = useMemo((): OrgGroup[] => {
    return goals
      .map((g) => ({
        orgSlug: g.orgSlug,
        label: ORG_BY_SLUG[g.orgSlug].label,
        pmOwner: ORG_BY_SLUG[g.orgSlug].pmOwner,
        projects: g.projects.filter((p) => p.startDate || p.targetDate),
        health: g.health,
      }))
      .filter((g) => g.projects.length > 0);
  }, [goals]);

  // Timeline bounds
  const { startDate, totalDays, columnWidth } = useMemo(() => {
    const now = new Date();
    let minDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    let maxDate = new Date(now.getFullYear(), now.getMonth() + 6, 0);

    for (const p of datedProjects) {
      if (p.startDate) { const d = new Date(p.startDate); if (d < minDate) minDate = d; }
      if (p.targetDate) { const d = new Date(p.targetDate); if (d > maxDate) maxDate = d; }
      for (const m of p.milestones) {
        if (m.targetDate) { const d = new Date(m.targetDate); if (d > maxDate) maxDate = d; }
      }
    }

    const days = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const colWidth = zoom === "week" ? 40 : zoom === "month" ? 12 : 4;
    return { startDate: minDate, totalDays: days, columnWidth: colWidth };
  }, [datedProjects, zoom]);

  // Time labels
  const timeLabels = useMemo(() => {
    const labels: { label: string; left: number; width: number; isCurrentMonth: boolean }[] = [];
    const cursor = new Date(startDate);
    const endDate = new Date(startDate.getTime() + totalDays * 86400000);
    const now = new Date();

    while (cursor <= endDate) {
      const dayOffset = Math.floor((cursor.getTime() - startDate.getTime()) / 86400000);
      const isCurrent = cursor.getMonth() === now.getMonth() && cursor.getFullYear() === now.getFullYear();

      if (zoom === "quarter") {
        const q = Math.floor(cursor.getMonth() / 3) + 1;
        const isCurrentQ = Math.floor(now.getMonth() / 3) + 1 === q && cursor.getFullYear() === now.getFullYear();
        labels.push({ label: `Q${q} ${cursor.getFullYear()}`, left: dayOffset * columnWidth, width: 90 * columnWidth, isCurrentMonth: isCurrentQ });
        cursor.setMonth(cursor.getMonth() + (3 - (cursor.getMonth() % 3)));
        cursor.setDate(1);
      } else if (zoom === "month") {
        const label = cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        const remaining = Math.min(daysInMonth - cursor.getDate() + 1, totalDays - dayOffset);
        labels.push({ label, left: dayOffset * columnWidth, width: remaining * columnWidth, isCurrentMonth: isCurrent });
        cursor.setMonth(cursor.getMonth() + 1);
        cursor.setDate(1);
      } else {
        const label = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        labels.push({ label, left: dayOffset * columnWidth, width: 7 * columnWidth, isCurrentMonth: false });
        cursor.setDate(cursor.getDate() + 7);
      }
    }
    return labels;
  }, [startDate, totalDays, columnWidth, zoom]);

  const todayOffset = Math.floor((Date.now() - startDate.getTime()) / 86400000);
  const totalWidth = totalDays * columnWidth;

  // Auto-scroll to today on mount and zoom change
  useEffect(() => {
    if (scrollRef.current && todayOffset > 0) {
      const scrollTarget = todayOffset * columnWidth - scrollRef.current.clientWidth / 3;
      scrollRef.current.scrollTo({ left: Math.max(0, scrollTarget), behavior: "smooth" });
    }
  }, [todayOffset, columnWidth]);

  function getLeadInitials(lead: string | null): string {
    if (!lead) return "";
    const parts = lead.split(/[@.\s]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0]?.substring(0, 2).toUpperCase() ?? "";
  }

  return (
    <div className="relative animate-in">
      {/* Zoom controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-accent/60" />
            {datedProjects.length} with dates
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-surface-2 border border-border" />
            {undatedProjects.length} undated
          </span>
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
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {datedProjects.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 mb-4">
            <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-text-secondary text-sm font-medium mb-1">No projects have dates</p>
          <p className="text-text-secondary/60 text-xs">Set start or target dates in Linear to see the timeline view.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-surface shadow-xl shadow-black/25">
          <div className="flex">
            {/* LEFT PANEL */}
            <div className="w-[280px] shrink-0 border-r border-border bg-surface">
              {/* Header */}
              <div className="border-b border-border bg-surface-2/50 px-4 flex items-center" style={{ height: HEADER_HEIGHT }}>
                <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Projects</span>
                <span className="ml-auto text-[10px] text-text-secondary bg-bg px-2 py-0.5 rounded-md font-medium">{datedProjects.length}</span>
              </div>

              {groups.map((group) => {
                const groupColor = ORG_COLORS[group.orgSlug];
                const isCollapsed = collapsedGroups.has(group.orgSlug);
                return (
                  <div key={group.orgSlug}>
                    <button
                      onClick={() => toggleGroup(group.orgSlug)}
                      className="w-full flex items-center gap-2.5 border-b border-border bg-surface-2/60 hover:bg-surface-2 transition-colors relative"
                      style={{ height: GROUP_HEADER_HEIGHT }}
                      aria-expanded={!isCollapsed}
                      aria-label={`${group.label} - ${group.projects.length} projects`}
                    >
                      <div className="absolute left-0 top-0 w-1 h-full rounded-r-full" style={{ backgroundColor: groupColor }} />
                      <div className="flex items-center gap-2 pl-5 pr-4 w-full">
                        <svg
                          className={`w-3 h-3 text-text-secondary transition-transform duration-200 shrink-0 ${isCollapsed ? "" : "rotate-90"}`}
                          fill="currentColor" viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold truncate">{group.label}</span>
                        <span className="text-[10px] text-text-secondary ml-auto bg-bg px-1.5 py-0.5 rounded-md shrink-0 font-medium">
                          {group.projects.length}
                        </span>
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="relative">
                        <div className="absolute left-0 top-0 w-1 h-full opacity-20 rounded-r-full" style={{ backgroundColor: groupColor }} />
                        {group.projects.map((project) => (
                          <div
                            key={project.id}
                            className="pl-5 pr-4 border-b border-border hover:bg-surface-2/50 transition-all flex items-center"
                            style={{ height: ROW_HEIGHT }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 ml-1">
                              {project.lead && (
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                  style={{
                                    backgroundColor: project.status.color || groupColor,
                                    boxShadow: `0 0 8px ${project.status.color || groupColor}30`,
                                  }}
                                  title={project.lead}
                                >
                                  {getLeadInitials(project.lead)}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{project.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                                    style={{ backgroundColor: (project.status.color || groupColor) + "20", color: project.status.color || groupColor }}
                                  >
                                    {project.status.name}
                                  </span>
                                  {project.progress > 0 && (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-12 h-1 rounded-full bg-bg overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-500"
                                          style={{ width: `${project.progress * 100}%`, backgroundColor: project.status.color || groupColor }}
                                        />
                                      </div>
                                      <span className="text-[10px] text-text-secondary tabular-nums">{Math.round(project.progress * 100)}%</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* TIMELINE AREA */}
            <div ref={scrollRef} className="flex-1 overflow-x-auto bg-bg timeline-scroll">
              {/* Time axis */}
              <div className="relative border-b border-border bg-surface-2/30 sticky top-0 z-10" style={{ height: HEADER_HEIGHT, minWidth: totalWidth }}>
                {timeLabels.map((tl, i) => (
                  <div
                    key={i}
                    className={`absolute top-0 h-full border-l border-border/50 px-3 text-[11px] flex items-center font-medium ${
                      tl.isCurrentMonth ? "text-accent-light bg-accent/5" : "text-text-secondary"
                    }`}
                    style={{ left: tl.left, width: tl.width }}
                  >
                    {tl.label}
                  </div>
                ))}
                {todayOffset >= 0 && todayOffset <= totalDays && (
                  <div className="absolute top-0 h-full z-20 flex flex-col items-center" style={{ left: todayOffset * columnWidth }}>
                    <div className="bg-red text-white text-[9px] font-bold px-2 py-0.5 rounded-b-md shadow-lg shadow-red/30">
                      TODAY
                    </div>
                    <div className="w-px flex-1 bg-red/60" />
                  </div>
                )}
              </div>

              {/* Rows */}
              {groups.map((group) => (
                <div key={group.orgSlug}>
                  <div className="border-b border-border/30 bg-surface-2/10" style={{ height: GROUP_HEADER_HEIGHT, minWidth: totalWidth }} />
                  {!collapsedGroups.has(group.orgSlug) &&
                    group.projects.map((project) => (
                      <div
                        key={project.id}
                        className="relative border-b border-border/30 hover:bg-surface-2/20 transition-colors"
                        style={{ height: ROW_HEIGHT, minWidth: totalWidth }}
                      >
                        <TimelineBar
                          project={project}
                          startDate={startDate}
                          columnWidth={columnWidth}
                          rowHeight={ROW_HEIGHT}
                        />
                        {todayOffset >= 0 && todayOffset <= totalDays && (
                          <div
                            className="absolute top-0 h-full w-px bg-red/15"
                            style={{ left: todayOffset * columnWidth }}
                          />
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Undated projects */}
      {undatedProjects.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Needs Dates in Linear</h3>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-orange bg-orange/10 border border-orange/20 px-2 py-0.5 rounded-md font-medium">
              {undatedProjects.length} project{undatedProjects.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-text-secondary/60 text-xs mb-3">
            These projects are missing start or target dates. Add dates in Linear to see them on the timeline.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {undatedProjects.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 px-4 py-3 hover:bg-surface hover:border-border transition-all"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.status.color }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-secondary">{p.status.name}</span>
                    <HealthBadge status={p.health} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
