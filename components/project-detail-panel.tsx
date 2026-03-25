"use client";

import { useEffect, useState, useCallback } from "react";
import type { ProjectSummary } from "@/lib/types";
import { MarkdownContent } from "./markdown-content";

interface ProjectDetailPanelProps {
  project: ProjectSummary;
  orgLabel: string;
  onClose: () => void;
}

function MiniTimeline({ project }: { project: ProjectSummary }) {
  const barColor = project.status.color || "#8b8b9e";
  const now = new Date();

  const pStart = project.startDate ? new Date(project.startDate) : null;
  const pEnd = project.targetDate ? new Date(project.targetDate) : null;

  if (!pStart && !pEnd) return null;

  const earliest = pStart ?? new Date(now.getTime() - 30 * 86400000);
  const latest = pEnd ?? new Date(now.getTime() + 90 * 86400000);
  const spanMs = latest.getTime() - earliest.getTime();
  const pad = spanMs * 0.1;
  const viewStart = new Date(earliest.getTime() - pad);
  const viewEnd = new Date(latest.getTime() + pad);
  const viewSpan = viewEnd.getTime() - viewStart.getTime();

  const toPercent = (date: Date) =>
    ((date.getTime() - viewStart.getTime()) / viewSpan) * 100;

  const barStartPct = pStart ? toPercent(pStart) : 0;
  const barEndPct = pEnd ? toPercent(pEnd) : 100;
  const barWidthPct = Math.max(barEndPct - barStartPct, 3);

  const todayPct = toPercent(now);
  const showToday = todayPct >= 0 && todayPct <= 100;

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="mt-5">
      <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-3">
        Timeline
      </p>
      <div className="relative h-10 rounded-xl bg-bg border border-border overflow-hidden">
        {/* Project bar */}
        <div
          className="absolute top-2 h-6 rounded-lg"
          style={{
            left: `${barStartPct}%`,
            width: `${barWidthPct}%`,
            backgroundColor: barColor + "25",
            border: `1px solid ${barColor}30`,
          }}
        >
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 rounded-lg"
            style={{
              width: `${Math.min(project.progress * 100, 100)}%`,
              background: `linear-gradient(90deg, ${barColor}cc, ${barColor}ee)`,
            }}
          />

          {/* Milestone diamonds */}
          {project.milestones.map((ms) => {
            if (!ms.targetDate) return null;
            const msDate = new Date(ms.targetDate);
            const msPct = toPercent(msDate);
            const relPct =
              barWidthPct > 0
                ? ((msPct - barStartPct) / barWidthPct) * 100
                : 0;
            if (relPct < 0 || relPct > 100) return null;
            return (
              <div
                key={ms.id}
                className="absolute top-1/2 -translate-y-1/2 z-10 group"
                style={{ left: `${relPct}%` }}
              >
                <div
                  className="w-2 h-2 rotate-45 bg-surface border-2"
                  style={{ borderColor: barColor }}
                />
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-2/95 backdrop-blur text-text text-[10px] rounded-lg whitespace-nowrap shadow-lg border border-border z-20">
                  {ms.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Today marker */}
        {showToday && (
          <div
            className="absolute top-0 h-full z-20"
            style={{ left: `${todayPct}%` }}
          >
            <div className="w-px h-full bg-red/60" />
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red" />
          </div>
        )}
      </div>

      {/* Date labels */}
      <div className="flex justify-between mt-1.5 text-[10px] text-text-secondary">
        <span>{pStart ? formatDate(pStart) : "No start date"}</span>
        {showToday && <span className="text-red font-medium">Today</span>}
        <span>{pEnd ? formatDate(pEnd) : "No target date"}</span>
      </div>
    </div>
  );
}

export function ProjectDetailPanel({
  project,
  orgLabel,
  onClose,
}: ProjectDetailPanelProps) {
  const [showFullUpdate, setShowFullUpdate] = useState(false);
  const barColor = project.status.color || "#8b8b9e";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset show-more state when project changes
  useEffect(() => {
    setShowFullUpdate(false);
  }, [project.id]);

  const updateText = project.latestUpdate ?? "";
  const isLongUpdate = updateText.length > 400;
  const displayUpdate =
    isLongUpdate && !showFullUpdate
      ? updateText.substring(0, 400).replace(/\s\S*$/, "").trim() + "..."
      : updateText;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[480px] max-w-[90vw] z-50 bg-surface border-l border-border shadow-2xl shadow-black/50 overflow-y-auto animate-in"
        style={{ animation: "slideInRight 0.25s ease-out both" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="font-bold text-text text-lg leading-tight">
              {project.name}
            </h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-lg border"
                style={{
                  backgroundColor: barColor + "20",
                  color: barColor,
                  borderColor: barColor + "30",
                }}
              >
                {project.status.name}
              </span>
              {project.health !== "none" && (
                <span
                  className={`text-xs font-medium px-2.5 py-0.5 rounded-lg ${
                    project.health === "onTrack"
                      ? "bg-green/15 text-green border border-green/20"
                      : project.health === "atRisk"
                        ? "bg-orange/15 text-orange border border-orange/20"
                        : "bg-red/15 text-red border border-red/20"
                  }`}
                >
                  {project.health === "onTrack"
                    ? "On Track"
                    : project.health === "atRisk"
                      ? "At Risk"
                      : "Off Track"}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-text-secondary hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-0 space-y-5">
          {project.description && (
            <p className="text-sm text-text-secondary leading-relaxed mt-3">
              {project.description}
            </p>
          )}

          {/* Mini timeline */}
          <MiniTimeline project={project} />

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-bg rounded-xl p-3 border border-border">
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                Lead
              </p>
              <p className="text-text mt-1 font-medium">
                {project.lead ?? "Unassigned"}
              </p>
            </div>
            <div className="bg-bg rounded-xl p-3 border border-border">
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                Org
              </p>
              <p className="text-text mt-1 font-medium">{orgLabel}</p>
            </div>
            <div className="bg-bg rounded-xl p-3 border border-border">
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                Start
              </p>
              <p className="text-text mt-1 font-medium">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "TBD"}
              </p>
            </div>
            <div className="bg-bg rounded-xl p-3 border border-border">
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                Target
              </p>
              <p className="text-text mt-1 font-medium">
                {project.targetDate
                  ? new Date(project.targetDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "TBD"}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {project.progress > 0 && (
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-text-secondary font-medium uppercase tracking-wider">
                  Progress
                </span>
                <span className="text-text-secondary font-semibold">
                  {Math.round(project.progress * 100)}%
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-bg border border-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${project.progress * 100}%`,
                    background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Milestones */}
          {project.milestones.length > 0 && (
            <div>
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-2">
                Milestones
              </p>
              <div className="space-y-1.5">
                {project.milestones.map((ms) => (
                  <div
                    key={ms.id}
                    className="flex items-center gap-2 text-sm bg-bg rounded-lg px-3 py-2 border border-border"
                  >
                    <div
                      className="w-2 h-2 rotate-45 border-2 shrink-0"
                      style={{ borderColor: barColor }}
                    />
                    <span className="text-text flex-1">{ms.name}</span>
                    {ms.targetDate && (
                      <span className="text-text-secondary text-xs">
                        {new Date(ms.targetDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Latest update */}
          {updateText && (
            <div>
              <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider mb-2">
                Latest Update
              </p>
              {project.latestUpdateDate && (
                <p className="text-[10px] text-text-secondary/60 mb-1.5">
                  {new Date(project.latestUpdateDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" },
                  )}
                </p>
              )}
              <div className="bg-bg rounded-xl p-4 border border-border">
                <MarkdownContent>{displayUpdate}</MarkdownContent>
                {isLongUpdate && (
                  <button
                    onClick={() => setShowFullUpdate(!showFullUpdate)}
                    className="text-xs text-accent-light hover:text-accent mt-3 transition-colors font-medium"
                  >
                    {showFullUpdate ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* View in Linear */}
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-accent/15 text-accent-light text-sm font-medium rounded-xl hover:bg-accent/25 border border-accent/20 transition-all"
            >
              View in Linear
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </>
  );
}
