"use client";

import { useEffect, useState } from "react";
import { ShippedEntry, OrgSlug } from "@/lib/types";
import { OrgFilter } from "@/components/org-filter";
import { ShippedEntryCard } from "@/components/shipped-entry";
import { CardSkeleton } from "@/components/skeleton";

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function groupByMonth(entries: ShippedEntry[]): Map<string, ShippedEntry[]> {
  const map = new Map<string, ShippedEntry[]>();
  for (const entry of entries) {
    const key = monthLabel(entry.completedAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

export default function ShippedPage() {
  const [filter, setFilter] = useState<OrgSlug | "all">("all");
  const [entries, setEntries] = useState<ShippedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter === "all" ? "" : `?team=${filter}`;
    fetch(`/api/shipped${params}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const grouped = groupByMonth(entries);

  return (
    <div className="pt-10 animate-in">
      <h1 className="text-xl font-bold tracking-tight mb-1">Shipped</h1>
      <p className="text-text-secondary text-sm mb-6">
        Completed projects across all Amplify teams.
      </p>

      <div className="mb-6">
        <OrgFilter selected={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <div>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 mb-4">
            <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-text-secondary text-sm font-medium mb-1">No shipped projects found</p>
          <p className="text-text-secondary/60 text-xs">Completed projects will appear here as they ship.</p>
        </div>
      ) : (
        <div className="animate-in">
          {Array.from(grouped.entries()).map(([month, items]) => (
            <div key={month} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-text-secondary">{month}</h2>
                <span className="text-[10px] text-text-secondary bg-surface-2 border border-border px-2 py-0.5 rounded-md font-medium">
                  {items.length}
                </span>
              </div>
              {items.map((entry) => (
                <ShippedEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
