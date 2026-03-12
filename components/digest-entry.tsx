"use client";

import { useState } from "react";
import { HealthBadge } from "./health-badge";
import { DigestEntry } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";

export function DigestEntryCard({ entry }: { entry: DigestEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = ORG_BY_SLUG[entry.orgSlug];

  return (
    <div className="bg-surface border border-border rounded-xl mb-3 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-surface-2/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded bg-accent/12 text-accent-light border border-accent/25">
            {config.label}
          </span>
          <span className="font-semibold text-sm">{entry.goalName}</span>
          <HealthBadge status={entry.health} />
        </div>
        <svg
          className={`w-4 h-4 text-text-secondary transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-5 pb-5 text-text-secondary text-[0.78rem] whitespace-pre-wrap border-t border-border pt-4">
          {entry.content}
        </div>
      )}
    </div>
  );
}
