"use client";

import { useState } from "react";
import { ShippedEntry } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";

export function ShippedEntryCard({ entry }: { entry: ShippedEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = ORG_BY_SLUG[entry.orgSlug];
  const isLong = entry.lastUpdate.length > 180;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-3 hover:border-border/80 transition-all">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <div className="w-5 h-5 rounded-full bg-green/15 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-semibold text-sm">{entry.projectName}</h3>
        <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-md bg-accent/12 text-accent-light border border-accent/25">
          {config.label}
        </span>
      </div>

      <p className="text-text-secondary text-xs mb-2">
        Completed{" "}
        {new Date(entry.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      <div className="text-text-secondary text-[0.78rem] mb-2">
        <p className={!expanded && isLong ? "line-clamp-2" : ""}>
          {entry.lastUpdate}
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

      {entry.loomUrl && (
        <a
          href={entry.loomUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-blue text-xs hover:underline mt-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Watch demo
        </a>
      )}
    </div>
  );
}
