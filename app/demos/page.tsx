"use client";

import { useEffect, useState } from "react";
import { DemoEntry, OrgSlug } from "@/lib/types";
import { OrgFilter } from "@/components/org-filter";
import { DemoCard } from "@/components/demo-card";

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
    <div className="pt-10">
      <h1 className="text-xl font-bold tracking-tight mb-1">Demos</h1>
      <p className="text-text-secondary text-sm mb-6">
        Loom walkthroughs from project updates.
      </p>

      <OrgFilter selected={filter} onChange={setFilter} />

      {loading ? (
        <div className="text-text-secondary text-sm">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-text-secondary text-sm">
          No demos found. Post Loom links in Linear project updates to see them here.
        </div>
      ) : (
        Array.from(grouped.entries()).map(([week, demos]) => (
          <div key={week} className="mb-8">
            <h2 className="text-sm font-semibold text-text-secondary mb-3">{week}</h2>
            {demos.map((demo) => (
              <DemoCard key={demo.id} entry={demo} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
