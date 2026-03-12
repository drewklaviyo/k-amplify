"use client";

import { useState } from "react";
import { ShippedEntry } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";

export function ShippedEntryCard({ entry }: { entry: ShippedEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = ORG_BY_SLUG[entry.orgSlug];
  const isLong = entry.lastUpdate.length > 180;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-3">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <h3 className="font-semibold text-sm">{entry.projectName}</h3>
        <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded bg-accent/12 text-accent-light border border-accent/25">
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
          className="text-blue text-xs hover:underline"
        >
          Watch demo &rarr;
        </a>
      )}
    </div>
  );
}
