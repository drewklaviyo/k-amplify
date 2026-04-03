// =============================================================================
// Portable Analytics — K:Amplify
// Requires: analytics_sessions, analytics_events, analytics_daily tables
// =============================================================================

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// --- Types ---

interface UserRow {
  email: string;
  name: string;
  lastActive: string;
  sessions: number;
  pageviews: number;
  events: number;
  topFeature: string;
}

interface UsersData {
  dau: number;
  wau: number;
  mau: number;
  dauPrev: number;
  wauPrev: number;
  mauPrev: number;
  users: UserRow[];
}

interface FeaturesData {
  featureRanking: { name: string; count: number }[];
  featureTrend: Record<string, unknown>[];
  unusedFeatures: string[];
  funnel: { step: string; users: number }[];
}

interface LiveUser {
  email: string;
  name: string;
  lastActive: string;
  currentPage: string;
  timeOnPage: number;
}

interface LiveEvent {
  id: string;
  email: string;
  name: string;
  type: string;
  eventName: string;
  path: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

interface LiveData {
  activeUsers: LiveUser[];
  events: LiveEvent[];
}

// --- Helpers ---

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function trendArrow(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "\u2191 new" : "\u2014";
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct > 0) return `\u2191 ${pct}%`;
  if (pct < 0) return `\u2193 ${Math.abs(pct)}%`;
  return "\u2192 0%";
}

function trendColor(current: number, previous: number): string {
  if (current > previous) return "text-green-400";
  if (current < previous) return "text-red-400";
  return "text-text-secondary";
}

function eventIcon(type: string): string {
  if (type === "pageview") return "\uD83D\uDC41";
  if (type === "click") return "\uD83D\uDC46";
  return "\u26A1";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// --- Component ---

export default function MetricsPage() {
  return (
    <Suspense fallback={<div className="pt-10 text-text-secondary">Loading metrics...</div>}>
      <MetricsDashboard />
    </Suspense>
  );
}

function MetricsDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") ?? "users";
  const range = searchParams.get("range") ?? "7d";

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/admin/metrics?${params.toString()}`);
  };

  const setRange = (r: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", r);
    router.push(`/admin/metrics?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Usage Metrics</h1>
        <div className="flex items-center gap-3">
          {/* Date range picker */}
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text"
          >
            <option value="1d">Today</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="90d">90 days</option>
          </select>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border">
        {["users", "features", "live"].map((tab) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "border-b-2 border-accent-light text-accent-light"
                : "text-text-secondary hover:text-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "users" && <UsersTab range={range} />}
      {activeTab === "features" && <FeaturesTab range={range} />}
      {activeTab === "live" && <LiveTab />}
    </div>
  );
}

// --- Users Tab ---

function UsersTab({ range }: { range: string }) {
  const [data, setData] = useState<UsersData | null>(null);
  const [sortKey, setSortKey] = useState<keyof UserRow>("lastActive");
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/stats?tab=users&range=${range}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  const handleSort = (key: keyof UserRow) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(key === "name" || key === "email");
    }
  };

  const sorted = data?.users
    ? [...data.users].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const cmp =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return sortAsc ? cmp : -cmp;
      })
    : [];

  if (loading) return <div className="py-8 text-center text-text-secondary">Loading...</div>;
  if (!data) return <div className="py-8 text-center text-text-secondary">No data</div>;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      {/* DAU / WAU / MAU cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "DAU", value: data.dau, prev: data.dauPrev },
          { label: "WAU", value: data.wau, prev: data.wauPrev },
          { label: "MAU", value: data.mau, prev: data.mauPrev },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <div className="text-sm text-text-secondary">{card.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-text">{card.value}</span>
              <span
                className={`text-sm font-medium ${trendColor(card.value, card.prev)}`}
              >
                {trendArrow(card.value, card.prev)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* User table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr>
              {(
                [
                  ["name", "Name"],
                  ["email", "Email"],
                  ["lastActive", "Last Active"],
                  ["sessions", "Sessions"],
                  ["pageviews", "Pageviews"],
                  ["events", "Events"],
                  ["topFeature", "Top Feature"],
                ] as [keyof UserRow, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="cursor-pointer px-4 py-2 text-left font-medium text-text-secondary hover:text-text"
                >
                  {label}{" "}
                  {sortKey === key ? (sortAsc ? "\u2191" : "\u2193") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((u) => {
              const isInactive =
                new Date(u.lastActive).getTime() < sevenDaysAgo;
              return (
                <tr
                  key={u.email}
                  className={isInactive ? "bg-amber-900/20" : "hover:bg-surface-2"}
                >
                  <td className="px-4 py-2 font-medium text-text">{u.name}</td>
                  <td className="px-4 py-2 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-2">
                    <span className={isInactive ? "text-amber-400 font-medium" : "text-text"}>
                      {timeAgo(u.lastActive)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-text">{u.sessions}</td>
                  <td className="px-4 py-2 text-center text-text">{u.pageviews}</td>
                  <td className="px-4 py-2 text-center text-text">{u.events}</td>
                  <td className="px-4 py-2">
                    <span className="rounded bg-accent-light/20 px-2 py-0.5 text-xs text-accent-light">
                      {u.topFeature}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Features Tab ---

function FeaturesTab({ range }: { range: string }) {
  const [data, setData] = useState<FeaturesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/stats?tab=features&range=${range}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) return <div className="py-8 text-center text-text-secondary">Loading...</div>;
  if (!data) return <div className="py-8 text-center text-text-secondary">No data</div>;

  const maxFunnelUsers = data.funnel[0]?.users ?? 1;
  const maxFeatureCount = data.featureRanking[0]?.count ?? 1;

  return (
    <div className="space-y-8">
      {/* Feature adoption funnel */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text">Feature Adoption Funnel</h2>
        <div className="space-y-2">
          {data.funnel.map((step) => {
            const pct =
              maxFunnelUsers > 0
                ? Math.round((step.users / maxFunnelUsers) * 100)
                : 0;
            return (
              <div key={step.step} className="flex items-center gap-3">
                <div className="w-44 text-sm text-text-secondary text-right">
                  {step.step}
                </div>
                <div className="flex-1 rounded bg-surface-2 h-7">
                  <div
                    className="h-7 rounded bg-accent-light flex items-center px-2 text-xs text-bg font-medium"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  >
                    {step.users} ({pct}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature usage ranking */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text">Feature Usage Ranking</h2>
        <div className="space-y-1.5">
          {data.featureRanking.slice(0, 20).map((f) => {
            const pct =
              maxFeatureCount > 0
                ? Math.round((f.count / maxFeatureCount) * 100)
                : 0;
            return (
              <div key={f.name} className="flex items-center gap-3">
                <div className="w-48 text-sm text-text-secondary text-right truncate">
                  {f.name}
                </div>
                <div className="flex-1 rounded bg-surface-2 h-6">
                  <div
                    className="h-6 rounded bg-violet-500 flex items-center px-2 text-xs text-white font-medium"
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  >
                    {f.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unused features */}
      {data.unusedFeatures.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-amber-400">
            Unused Features (7d)
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.unusedFeatures.map((f) => (
              <span
                key={f}
                className="rounded-full bg-amber-900/30 border border-amber-700 px-3 py-1 text-xs text-amber-400"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Live Tab ---

function LiveTab() {
  const [data, setData] = useState<LiveData | null>(null);

  const fetchLive = useCallback(() => {
    fetch("/api/analytics/live")
      .then((r) => r.json())
      .then(setData)
      .catch((err) => console.warn("[metrics] live fetch failed", err));
  }, []);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 10_000);
    return () => clearInterval(interval);
  }, [fetchLive]);

  if (!data) return <div className="py-8 text-center text-text-secondary">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Active now */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text">
          Active Now{" "}
          <span className="ml-2 inline-flex h-5 items-center rounded-full bg-green-900/40 px-2 text-xs text-green-400">
            {data.activeUsers.length}
          </span>
        </h2>
        {data.activeUsers.length === 0 ? (
          <div className="text-sm text-text-secondary">No active users right now.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {data.activeUsers.map((u) => (
              <div
                key={u.email}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-light/20 text-xs font-bold text-accent-light">
                  {initials(u.name ?? u.email ?? "?")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text">
                    {u.name ?? u.email}
                  </div>
                  <div className="truncate text-xs text-text-secondary">
                    {u.currentPage} &middot; {u.timeOnPage}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent event stream */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-text">Recent Events</h2>
        <div className="max-h-[500px] overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-text-secondary w-24">
                  Time
                </th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary w-40">
                  User
                </th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary w-8">
                  &nbsp;
                </th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary">
                  Event
                </th>
                <th className="px-3 py-2 text-left font-medium text-text-secondary">
                  Page
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.events.map((e) => (
                <tr key={e.id} className="hover:bg-surface-2">
                  <td className="px-3 py-1.5 text-text-secondary">
                    {timeAgo(e.timestamp)}
                  </td>
                  <td className="px-3 py-1.5 truncate max-w-[160px] text-text">
                    {e.name ?? e.email}
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    {eventIcon(e.type)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-xs text-text">
                    {e.eventName}
                  </td>
                  <td className="px-3 py-1.5 text-text-secondary truncate max-w-[200px]">
                    {e.path}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
