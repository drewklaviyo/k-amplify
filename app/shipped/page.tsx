"use client";

import { useEffect, useState } from "react";
import { ShippedEntry, OrgSlug } from "@/lib/types";
import { OrgFilter } from "@/components/org-filter";
import { ShippedEntryCard } from "@/components/shipped-entry";

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
    <div className="pt-10">
      <h1 className="text-xl font-bold tracking-tight mb-1">Shipped</h1>
      <p className="text-text-secondary text-sm mb-6">
        Completed projects across all Amplify teams.
      </p>

      <OrgFilter selected={filter} onChange={setFilter} />

      {loading ? (
        <div className="text-text-secondary text-sm">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-text-secondary text-sm">No shipped projects found.</div>
      ) : (
        Array.from(grouped.entries()).map(([month, items]) => (
          <div key={month} className="mb-8">
            <h2 className="text-sm font-semibold text-text-secondary mb-3">{month}</h2>
            {items.map((entry) => (
              <ShippedEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
