"use client";

import type { ProjectSummary } from "@/lib/types";

interface TimelineBarProps {
  project: ProjectSummary;
  startDate: Date;
  columnWidth: number;
  rowHeight: number;
}

export function TimelineBar({ project, startDate, columnWidth, rowHeight }: TimelineBarProps) {
  const pStart = project.startDate ? new Date(project.startDate) : null;
  const pEnd = project.targetDate ? new Date(project.targetDate) : null;

  if (!pStart && !pEnd) return null;

  const startDay = pStart ? Math.floor((pStart.getTime() - startDate.getTime()) / 86400000) : null;
  const endDay = pEnd ? Math.floor((pEnd.getTime() - startDate.getTime()) / 86400000) : null;

  const barLeft = startDay != null ? startDay * columnWidth : 0;
  const barWidth =
    startDay != null && endDay != null
      ? Math.max((endDay - startDay) * columnWidth, 40)
      : startDay != null ? 120 : endDay != null ? endDay * columnWidth : 120;

  const barColor = project.status.color || "#6c5ce7";
  const openRight = startDay != null && endDay == null;
  const openLeft = startDay == null && endDay != null;

  const barHeight = Math.round(rowHeight * 0.5);
  const barTop = Math.round((rowHeight - barHeight) / 2);

  const healthColor = project.health === "onTrack" ? "#00b894" :
    project.health === "atRisk" ? "#fdcb6e" :
    project.health === "offTrack" ? "#e17055" : null;

  return (
    <div
      className="absolute group"
      style={{ left: openLeft ? 0 : barLeft, width: barWidth, height: barHeight, top: barTop }}
    >
      <div
        className={`relative h-full w-full rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group-hover:scale-[1.02] ${
          openRight ? "rounded-r-none" : ""
        } ${openLeft ? "rounded-l-none" : ""}`}
        style={{
          backgroundColor: barColor + "25",
          boxShadow: `0 0 8px ${barColor}15`,
          border: `1px solid ${barColor}30`,
        }}
      >
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-xl transition-all duration-500"
          style={{
            width: `${Math.min(project.progress * 100, 100)}%`,
            background: `linear-gradient(90deg, ${barColor}cc, ${barColor}ee)`,
          }}
        />

        {/* Milestone markers */}
        {project.milestones.map((ms) => {
          if (!ms.targetDate) return null;
          const msDay = Math.floor((new Date(ms.targetDate).getTime() - startDate.getTime()) / 86400000);
          const msPos = ((msDay * columnWidth - barLeft) / barWidth) * 100;
          if (msPos < 0 || msPos > 100) return null;
          return (
            <div
              key={ms.id}
              className="absolute top-1/2 -translate-y-1/2 z-20 group/ms"
              style={{ left: `${msPos}%` }}
            >
              <div
                className="w-2.5 h-2.5 rotate-45 bg-[var(--bg)] border-2 shadow-sm transition-all group-hover/ms:scale-125"
                style={{ borderColor: barColor, boxShadow: `0 0 6px ${barColor}50` }}
              />
              <div className="hidden group-hover/ms:block absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-surface-2/95 backdrop-blur-sm text-text text-[11px] rounded-lg whitespace-nowrap shadow-xl border border-border z-30 pointer-events-none">
                {ms.name}
                {ms.targetDate && <span className="text-text-secondary ml-1.5">{new Date(ms.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
              </div>
            </div>
          );
        })}

        {/* Open-ended indicator */}
        {openRight && (
          <div className="absolute right-0 top-0 h-full w-4 flex items-center justify-center">
            <svg className="w-3 h-3 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* CSS-based tooltip on hover */}
      <div className="hidden group-hover:block absolute z-40 top-full mt-3 w-72 rounded-xl bg-surface-2/95 backdrop-blur-sm border border-border p-4 shadow-2xl pointer-events-none"
        style={{ left: barWidth > 200 ? 0 : "50%", transform: barWidth > 200 ? "none" : "translateX(-25%)" }}
      >
        <p className="font-semibold text-text text-sm">{project.name}</p>
        {project.lead && <p className="text-text-secondary text-xs mt-0.5">Lead: {project.lead}</p>}

        {project.progress > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-text-secondary mb-1">
              <span>Progress</span>
              <span className="font-medium tabular-nums">{Math.round(project.progress * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${project.progress * 100}%`, background: `linear-gradient(90deg, ${barColor}cc, ${barColor})` }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <span
            className="px-2 py-0.5 rounded-lg font-medium border"
            style={{ backgroundColor: barColor + "20", color: barColor, borderColor: barColor + "30" }}
          >
            {project.status.name}
          </span>
          {healthColor && (
            <span
              className="px-2 py-0.5 rounded-lg font-medium border"
              style={{ backgroundColor: healthColor + "20", color: healthColor, borderColor: healthColor + "30" }}
            >
              {project.health === "onTrack" ? "On Track" : project.health === "atRisk" ? "At Risk" : "Off Track"}
            </span>
          )}
        </div>

        {project.milestones.length > 0 && (
          <div className="mt-3 border-t border-border pt-2">
            <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider mb-1">Milestones</p>
            {project.milestones.map((ms) => (
              <div key={ms.id} className="flex items-center gap-1.5 text-xs text-text-secondary mt-0.5">
                <div className="w-1.5 h-1.5 rotate-45 border shrink-0" style={{ borderColor: barColor }} />
                <span className="truncate">{ms.name}</span>
                {ms.targetDate && <span className="text-text-secondary/60 ml-auto shrink-0">{new Date(ms.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-2 text-xs text-text-secondary/60 tabular-nums">
          {project.startDate ? new Date(project.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"} &rarr; {project.targetDate ? new Date(project.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD"}
        </div>

        {project.latestUpdate && (
          <div className="mt-2 border-t border-border pt-2">
            <p className="text-xs text-text-secondary line-clamp-3">{project.latestUpdate}</p>
          </div>
        )}
      </div>
    </div>
  );
}
