"use client";

import { useEffect, useState } from "react";
import { DigestEntry, OrgSlug } from "@/lib/types";
import { OrgFilter } from "@/components/org-filter";
import { DigestEntryCard } from "@/components/digest-entry";

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
    <div className="pt-10">
      <h1 className="text-xl font-bold tracking-tight mb-1">Digests</h1>
      <p className="text-text-secondary text-sm mb-6">
        Monthly summaries from each Amplify org.
      </p>

      <OrgFilter selected={filter} onChange={setFilter} />

      {loading ? (
        <div className="text-text-secondary text-sm">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-text-secondary text-sm">No digests found.</div>
      ) : (
        Array.from(grouped.entries()).map(([month, items]) => (
          <div key={month} className="mb-8">
            <h2 className="text-sm font-semibold text-text-secondary mb-3">{month}</h2>
            {items.map((entry) => (
              <DigestEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
