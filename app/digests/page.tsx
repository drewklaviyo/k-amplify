"use client";

import { useEffect, useState } from "react";
import { DigestEntry, OrgSlug } from "@/lib/types";
import { OrgFilter } from "@/components/org-filter";
import { DigestEntryCard } from "@/components/digest-entry";
import { CardSkeleton } from "@/components/skeleton";

function groupByMonth(entries: DigestEntry[]): Map<string, DigestEntry[]> {
  const map = new Map<string, DigestEntry[]>();
  for (const entry of entries) {
    const key = entry.month;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

export default function DigestsPage() {
  const [filter, setFilter] = useState<OrgSlug | "all">("all");
  const [entries, setEntries] = useState<DigestEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter === "all" ? "" : `?team=${filter}`;
    fetch(`/api/digests${params}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const grouped = groupByMonth(entries);

  return (
    <div className="pt-10 animate-in">
      <h1 className="text-xl font-bold tracking-tight mb-1">Digests</h1>
      <p className="text-text-secondary text-sm mb-6">
        Monthly summaries from each Amplify org.
      </p>

      <div className="mb-6">
        <OrgFilter selected={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <div>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 mb-4">
            <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-text-secondary text-sm font-medium mb-1">No digests found</p>
          <p className="text-text-secondary/60 text-xs">Monthly digests will appear here as they are published.</p>
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
                <DigestEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
