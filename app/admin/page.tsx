"use client";

import { useEffect, useState, useCallback } from "react";
import type { VotingPeriod, SubmissionWithVotes, Progress, ConfigRow, Person, HoursSaved } from "@/lib/supabase-types";
import { ORG_CONFIGS } from "@/lib/config";

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState("");

  // Mountain progress state
  const [progressEntries, setProgressEntries] = useState<Progress[]>([]);
  const [weekLabel, setWeekLabel] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [progressLoading, setProgressLoading] = useState(false);

  // Hours saved state
  const [hoursEntries, setHoursEntries] = useState<HoursSaved[]>([]);
  const [hoursTotals, setHoursTotals] = useState<Record<string, number>>({});
  const [hoursOrg, setHoursOrg] = useState<string>(ORG_CONFIGS[0].slug);
  const [hoursWeek, setHoursWeek] = useState("");
  const [hoursAmount, setHoursAmount] = useState("");
  const [hoursNote, setHoursNote] = useState("");
  const [hoursLoading, setHoursLoading] = useState(false);

  // Voting management state
  const [currentPeriod, setCurrentPeriod] = useState<VotingPeriod | null>(null);
  const [topSubmissions, setTopSubmissions] = useState<SubmissionWithVotes[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [builderWinnerId, setBuilderWinnerId] = useState("");
  const [builderWinnerName, setBuilderWinnerName] = useState("");
  const [learnerWinnerId, setLearnerWinnerId] = useState("");
  const [learnerWinnerName, setLearnerWinnerName] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Config state
  const [configEntries, setConfigEntries] = useState<ConfigRow[]>([]);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configValue, setConfigValue] = useState("");

  // Load admin email from cookie
  useEffect(() => {
    const email = document.cookie
      .split("; ")
      .find((c) => c.startsWith("bka_user_email="))
      ?.split("=")[1];
    if (email) setAdminEmail(decodeURIComponent(email));
  }, []);

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch("/api/progress");
      const data = await res.json();
      setProgressEntries(data.entries ?? []);
    } catch {}
  }, []);

  // Fetch voting period and submissions
  const fetchVoting = useCallback(async () => {
    try {
      const [periodRes, subsRes] = await Promise.all([
        fetch("/api/voting-period"),
        fetch("/api/demos?supabase=1&all=1"),
      ]);
      const periodData = await periodRes.json();
      const subsData = await subsRes.json();

      setCurrentPeriod(periodData.period);

      // Sort by total votes
      const subs: SubmissionWithVotes[] = subsData.submissions ?? [];
      subs.sort((a, b) => (b.builder_votes + b.learner_votes) - (a.builder_votes + a.learner_votes));
      setTopSubmissions(subs.slice(0, 20));
    } catch {}
  }, []);

  // Fetch config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/config");
      const data = await res.json();
      setConfigEntries(data.config ?? []);
    } catch {}
  }, []);

  // Fetch people
  const fetchPeople = useCallback(async () => {
    try {
      const res = await fetch(`/api/people?search=${encodeURIComponent(peopleSearch)}`);
      const data = await res.json();
      setPeople(data.people ?? []);
    } catch {}
  }, [peopleSearch]);

  // Fetch hours saved data
  const fetchHoursSaved = useCallback(async () => {
    try {
      const res = await fetch("/api/hours-saved");
      const data = await res.json();
      setHoursEntries(data.entries ?? []);
      setHoursTotals(data.totals ?? {});
    } catch {}
  }, []);

  useEffect(() => { fetchProgress(); fetchVoting(); fetchConfig(); fetchHoursSaved(); }, [fetchProgress, fetchVoting, fetchConfig, fetchHoursSaved]);
  useEffect(() => { if (peopleSearch) fetchPeople(); }, [peopleSearch, fetchPeople]);

  const handleAddProgress = async () => {
    if (!weekLabel || !estimatedHours) return;
    setProgressLoading(true);
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          weekLabel,
          estimatedHours: Number(estimatedHours),
          note: progressNote || null,
        }),
      });
      setWeekLabel("");
      setEstimatedHours("");
      setProgressNote("");
      fetchProgress();
    } catch {}
    setProgressLoading(false);
  };

  const handleAddHours = async () => {
    if (!hoursOrg || !hoursWeek || !hoursAmount) return;
    setHoursLoading(true);
    try {
      await fetch("/api/hours-saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          orgSlug: hoursOrg,
          weekLabel: hoursWeek,
          hours: Number(hoursAmount),
          note: hoursNote || null,
        }),
      });
      setHoursWeek("");
      setHoursAmount("");
      setHoursNote("");
      fetchHoursSaved();
    } catch {}
    setHoursLoading(false);
  };

  const handleConfirmWinners = async () => {
    if (!currentPeriod || (!builderWinnerId && !learnerWinnerId)) return;
    setConfirmLoading(true);
    try {
      const awards = [];
      if (builderWinnerId) {
        awards.push({
          submissionId: builderWinnerId,
          votingPeriodId: currentPeriod.id,
          category: "builder",
          voteCount: topSubmissions.find((s) => s.id === builderWinnerId)?.builder_votes ?? 0,
          winnerName: builderWinnerName,
        });
      }
      if (learnerWinnerId) {
        awards.push({
          submissionId: learnerWinnerId,
          votingPeriodId: currentPeriod.id,
          category: "learner",
          voteCount: topSubmissions.find((s) => s.id === learnerWinnerId)?.learner_votes ?? 0,
          winnerName: learnerWinnerName,
        });
      }

      await fetch("/api/awards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail, awards }),
      });

      fetchVoting();
    } catch {}
    setConfirmLoading(false);
  };

  const handleUpdateConfig = async (key: string) => {
    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(configValue);
      } catch {
        parsedValue = configValue;
      }

      await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail, key, value: parsedValue }),
      });

      setEditingConfig(null);
      setConfigValue("");
      fetchConfig();
    } catch {}
  };

  const handleTriggerSync = async (endpoint: string) => {
    try {
      await fetch(endpoint, { method: "POST" });
      if (endpoint.includes("demos")) fetchVoting();
      if (endpoint.includes("people")) fetchPeople();
    } catch {}
  };

  return (
    <div className="pt-10 animate-in max-w-4xl">
      <h1 className="text-xl font-bold tracking-tight mb-1">Admin Panel</h1>
      <p className="text-text-secondary text-sm mb-8">
        Manage mountain progress, voting, and configuration.
      </p>

      {/* Quick actions */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => handleTriggerSync("/api/demos/sync")}
          className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-text hover:border-accent/30 transition-all"
        >
          Sync Demos Now
        </button>
        <button
          onClick={() => handleTriggerSync("/api/people/sync")}
          className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-text hover:border-accent/30 transition-all"
        >
          Sync People Now
        </button>
      </div>

      {/* Mountain Progress */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Mountain Progress</h2>

        <div className="rounded-xl border border-border bg-surface p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Week of (e.g., Mar 17)"
              value={weekLabel}
              onChange={(e) => setWeekLabel(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Estimated hours this week"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none"
            />
          </div>
          <button
            onClick={handleAddProgress}
            disabled={progressLoading || !weekLabel || !estimatedHours}
            className="px-4 py-2 bg-accent/15 text-accent-light text-sm font-medium rounded-lg hover:bg-accent/25 border border-accent/20 transition-all disabled:opacity-50"
          >
            {progressLoading ? "Adding..." : "Add Progress Entry"}
          </button>
        </div>

        {/* Progress ledger */}
        {progressEntries.length > 0 && (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-text-secondary uppercase tracking-wider border-b border-border">
                  <th className="text-left p-3 font-semibold">Week</th>
                  <th className="text-right p-3 font-semibold">Hours</th>
                  <th className="text-right p-3 font-semibold">Cumulative</th>
                  <th className="text-left p-3 font-semibold">Note</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {progressEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-2/50">
                    <td className="p-3 text-text">{entry.week_label}</td>
                    <td className="p-3 text-right tabular-nums text-text">{entry.estimated_hours.toLocaleString()}</td>
                    <td className="p-3 text-right tabular-nums font-medium text-accent-light">{entry.cumulative_hours.toLocaleString()}</td>
                    <td className="p-3 text-text-secondary text-xs">{entry.note ?? "—"}</td>
                    <td className="p-3 text-text-secondary text-xs">
                      {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Hours Saved by Team */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Hours Saved by Team</h2>

        {/* Totals summary */}
        {Object.keys(hoursTotals).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {ORG_CONFIGS.map((org) => (
              <div key={org.slug} className="bg-bg border border-border rounded-lg px-3 py-2 text-xs">
                <span className="text-text-secondary font-medium">{org.label}</span>
                <span className="ml-2 text-text font-bold tabular-nums">{((hoursTotals[org.slug] ?? 0) / 1000).toFixed(0)}K</span>
              </div>
            ))}
            <div className="bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 text-xs">
              <span className="text-accent-light font-medium">Total</span>
              <span className="ml-2 text-accent-light font-bold tabular-nums">
                {(Object.values(hoursTotals).reduce((s, h) => s + h, 0) / 1000).toFixed(0)}K
              </span>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-surface p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
            <select
              value={hoursOrg}
              onChange={(e) => setHoursOrg(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text focus:border-accent/50 focus:outline-none"
            >
              {ORG_CONFIGS.map((org) => (
                <option key={org.slug} value={org.slug}>{org.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Week of (e.g., Mar 17)"
              value={hoursWeek}
              onChange={(e) => setHoursWeek(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Hours saved"
              value={hoursAmount}
              onChange={(e) => setHoursAmount(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={hoursNote}
              onChange={(e) => setHoursNote(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none"
            />
          </div>
          <button
            onClick={handleAddHours}
            disabled={hoursLoading || !hoursWeek || !hoursAmount}
            className="px-4 py-2 bg-accent/15 text-accent-light text-sm font-medium rounded-lg hover:bg-accent/25 border border-accent/20 transition-all disabled:opacity-50"
          >
            {hoursLoading ? "Adding..." : "Add Hours Entry"}
          </button>
        </div>

        {/* Recent entries */}
        {hoursEntries.length > 0 && (
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-text-secondary uppercase tracking-wider border-b border-border">
                  <th className="text-left p-3 font-semibold">Team</th>
                  <th className="text-left p-3 font-semibold">Week</th>
                  <th className="text-right p-3 font-semibold">Hours</th>
                  <th className="text-left p-3 font-semibold">Note</th>
                  <th className="text-left p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {hoursEntries.slice(0, 30).map((entry) => {
                  const orgLabel = ORG_CONFIGS.find((c) => c.slug === entry.org_slug)?.label ?? entry.org_slug;
                  return (
                    <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-2/50">
                      <td className="p-3 text-text font-medium">{orgLabel}</td>
                      <td className="p-3 text-text">{entry.week_label}</td>
                      <td className="p-3 text-right tabular-nums text-accent-light font-medium">{entry.hours.toLocaleString()}</td>
                      <td className="p-3 text-text-secondary text-xs">{entry.note ?? "—"}</td>
                      <td className="p-3 text-text-secondary text-xs">
                        {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Voting Management */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Voting Management</h2>

        {currentPeriod && (
          <div className="rounded-xl border border-border bg-surface p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium text-text">{currentPeriod.week_label}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                currentPeriod.status === "open"
                  ? "bg-green/15 text-green border border-green/20"
                  : currentPeriod.status === "closed"
                    ? "bg-orange/15 text-orange border border-orange/20"
                    : "bg-accent/15 text-accent-light border border-accent/20"
              }`}>
                {currentPeriod.status}
              </span>
            </div>

            {(currentPeriod.status === "closed" || currentPeriod.status === "open") && (
              <>
                <p className="text-xs text-text-secondary mb-3">Top submissions by votes:</p>
                <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                  {topSubmissions
                    .filter((s) => s.voting_period_id === currentPeriod.id)
                    .map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 bg-bg rounded-lg px-3 py-2 border border-border text-xs"
                    >
                      <span className="text-text font-medium flex-1 truncate">{sub.title}</span>
                      <span className="text-text-secondary">{sub.submitter_name}</span>
                      <span className="tabular-nums text-accent-light">🔨 {sub.builder_votes}</span>
                      <span className="tabular-nums text-blue">📚 {sub.learner_votes}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <p className="text-xs font-semibold text-text">Confirm Winners</p>

                  {/* People search */}
                  <input
                    type="text"
                    placeholder="Search people..."
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none w-full"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block mb-1">
                        Builder Winner
                      </label>
                      <select
                        value={builderWinnerId}
                        onChange={(e) => {
                          setBuilderWinnerId(e.target.value);
                          const sub = topSubmissions.find((s) => s.id === e.target.value);
                          if (sub) setBuilderWinnerName(sub.submitter_name);
                        }}
                        className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text w-full focus:border-accent/50 focus:outline-none"
                      >
                        <option value="">Select submission...</option>
                        {topSubmissions
                          .filter((s) => s.voting_period_id === currentPeriod.id)
                          .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.submitter_name}) — 🔨 {s.builder_votes}
                          </option>
                        ))}
                      </select>
                      {/* Override winner name with person lookup */}
                      {builderWinnerId && (
                        <select
                          value={builderWinnerName}
                          onChange={(e) => setBuilderWinnerName(e.target.value)}
                          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text w-full mt-2 focus:border-accent/50 focus:outline-none"
                        >
                          <option value={builderWinnerName}>{builderWinnerName}</option>
                          {people.map((p) => (
                            <option key={p.linear_id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider block mb-1">
                        Learner Winner
                      </label>
                      <select
                        value={learnerWinnerId}
                        onChange={(e) => {
                          setLearnerWinnerId(e.target.value);
                          const sub = topSubmissions.find((s) => s.id === e.target.value);
                          if (sub) setLearnerWinnerName(sub.submitter_name);
                        }}
                        className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text w-full focus:border-accent/50 focus:outline-none"
                      >
                        <option value="">Select submission...</option>
                        {topSubmissions
                          .filter((s) => s.voting_period_id === currentPeriod.id)
                          .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title} ({s.submitter_name}) — 📚 {s.learner_votes}
                          </option>
                        ))}
                      </select>
                      {learnerWinnerId && (
                        <select
                          value={learnerWinnerName}
                          onChange={(e) => setLearnerWinnerName(e.target.value)}
                          className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text w-full mt-2 focus:border-accent/50 focus:outline-none"
                        >
                          <option value={learnerWinnerName}>{learnerWinnerName}</option>
                          {people.map((p) => (
                            <option key={p.linear_id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmWinners}
                    disabled={confirmLoading || (!builderWinnerId && !learnerWinnerId)}
                    className="px-4 py-2 bg-accent/15 text-accent-light text-sm font-medium rounded-lg hover:bg-accent/25 border border-accent/20 transition-all disabled:opacity-50"
                  >
                    {confirmLoading ? "Confirming..." : "Confirm & Announce Winners"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* Config Editor */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Configuration</h2>

        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-text-secondary uppercase tracking-wider border-b border-border">
                <th className="text-left p-3 font-semibold">Key</th>
                <th className="text-left p-3 font-semibold">Value</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {configEntries.map((entry) => (
                <tr key={entry.key} className="border-b border-border/50 hover:bg-surface-2/50">
                  <td className="p-3 font-mono text-xs text-text">{entry.key}</td>
                  <td className="p-3 text-text-secondary text-xs max-w-md">
                    {editingConfig === entry.key ? (
                      <textarea
                        value={configValue}
                        onChange={(e) => setConfigValue(e.target.value)}
                        className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text w-full min-h-[60px] font-mono focus:border-accent/50 focus:outline-none"
                      />
                    ) : (
                      <span className="block truncate max-w-md">
                        {typeof entry.value === "string" ? entry.value : JSON.stringify(entry.value)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {editingConfig === entry.key ? (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleUpdateConfig(entry.key)}
                          className="px-2 py-1 bg-green/15 text-green text-xs rounded-md border border-green/20 hover:bg-green/25"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingConfig(null); setConfigValue(""); }}
                          className="px-2 py-1 bg-surface-2 text-text-secondary text-xs rounded-md border border-border hover:text-text"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingConfig(entry.key);
                          setConfigValue(
                            typeof entry.value === "string" ? entry.value : JSON.stringify(entry.value, null, 2),
                          );
                        }}
                        className="px-2 py-1 bg-surface-2 text-text-secondary text-xs rounded-md border border-border hover:text-text"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
