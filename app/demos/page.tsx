"use client";

import { useEffect, useState } from "react";
import { DemoEntry, OrgSlug } from "@/lib/types";
import { OrgFilter } from "@/components/org-filter";
import { DemoCard } from "@/components/demo-card";
import { CardSkeleton } from "@/components/skeleton";

function weekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return `Week of ${monday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function groupByWeek(entries: DemoEntry[]): Map<string, DemoEntry[]> {
  const map = new Map<string, DemoEntry[]>();
  for (const entry of entries) {
    const key = weekLabel(entry.date);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return map;
}

export default function DemosPage() {
  const [filter, setFilter] = useState<OrgSlug | "all">("all");
  const [entries, setEntries] = useState<DemoEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = filter === "all" ? "" : `?team=${filter}`;
    fetch(`/api/demos${params}`)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const grouped = groupByWeek(entries);

  return (
    <div className="pt-10 animate-in">
      <h1 className="text-xl font-bold tracking-tight mb-1">Demos</h1>
      <p className="text-text-secondary text-sm mb-6">
        Loom walkthroughs from project updates.
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-text-secondary text-sm font-medium mb-1">No demos found</p>
          <p className="text-text-secondary/60 text-xs">Post Loom links in Linear project updates to see them here.</p>
        </div>
      ) : (
        <div className="animate-in">
          {Array.from(grouped.entries()).map(([week, demos]) => (
            <div key={week} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-text-secondary">{week}</h2>
                <span className="text-[10px] text-text-secondary bg-surface-2 border border-border px-2 py-0.5 rounded-md font-medium">
                  {demos.length}
                </span>
              </div>
              {demos.map((demo) => (
                <DemoCard key={demo.id} entry={demo} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
