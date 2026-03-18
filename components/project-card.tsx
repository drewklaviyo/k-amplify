"use client";

import { useState } from "react";
import { HealthBadge } from "./health-badge";
import { ProjectSummary } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const [expanded, setExpanded] = useState(false);
  const config = ORG_BY_SLUG[project.orgSlug];
  const updateText = project.latestUpdate ?? "No updates yet.";
  const isLong = updateText.length > 180;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-3 hover:border-border/80 transition-all">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm">{project.name}</h3>
          <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-md bg-accent/12 text-accent-light border border-accent/25">
            {config.label}
          </span>
        </div>
        <HealthBadge status={project.health} />
      </div>

      {/* Progress bar if available */}
      {project.progress > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${project.progress * 100}%`,
                backgroundColor: project.status.color || "var(--color-accent)",
              }}
            />
          </div>
          <span className="text-[0.68rem] text-text-secondary tabular-nums font-medium">{Math.round(project.progress * 100)}%</span>
        </div>
      )}

      <div className="text-text-secondary text-[0.78rem] mb-3">
        <p className={!expanded && isLong ? "line-clamp-2" : ""}>
          {updateText}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-accent-light text-xs mt-1 hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {project.milestones.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {project.milestones
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((m) => (
              <span
                key={m.id}
                className="text-[0.68rem] px-2 py-0.5 rounded-md bg-surface-2 text-text-secondary border border-border"
              >
                {m.name}
                {m.targetDate && (
                  <span className="ml-1 text-text-secondary/60">
                    {new Date(m.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
              </span>
            ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        {project.lead && (
          <span className="text-[0.68rem] text-text-secondary">
            Lead: {project.lead}
          </span>
        )}
        <span className="text-[0.68rem] text-text-secondary/60 ml-auto">
          Updated {new Date(project.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
    </div>
  );
}
