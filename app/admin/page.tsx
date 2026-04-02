"use client";

import { useEffect, useState, useCallback } from "react";
import type { VotingPeriod, SubmissionWithVotes, ConfigRow, Person, HoursSaved } from "@/lib/supabase-types";
import { ORG_CONFIGS } from "@/lib/config";

export default function AdminPage() {
  const [adminEmail, setAdminEmail] = useState("");

  // Hours saved state
  const [hoursEntries, setHoursEntries] = useState<HoursSaved[]>([]);
  const [hoursTotals, setHoursTotals] = useState<Record<string, number>>({});
  const [hoursOrg, setHoursOrg] = useState<string>(ORG_CONFIGS[0].slug);
  const [hoursWeek, setHoursWeek] = useState("");
  const [hoursAmount, setHoursAmount] = useState("");
  const [hoursNote, setHoursNote] = useState("");
  const [hoursLoading, setHoursLoading] = useState(false);
  const [editingHoursId, setEditingHoursId] = useState<string | null>(null);
  const [editHoursValue, setEditHoursValue] = useState("");
  const [editNoteValue, setEditNoteValue] = useState("");

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

  // Load admin email from Okta session
  useEffect(() => {
    fetch("/api/auth/session-info")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.email) setAdminEmail(d.user.email);
      })
      .catch(() => {});
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

  useEffect(() => { fetchVoting(); fetchConfig(); fetchHoursSaved(); }, [fetchVoting, fetchConfig, fetchHoursSaved]);
  useEffect(() => { if (peopleSearch) fetchPeople(); }, [peopleSearch, fetchPeople]);

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

  const handleEditHours = async (id: string) => {
    try {
      await fetch("/api/hours-saved", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, hours: Number(editHoursValue), note: editNoteValue || null }),
      });
      setEditingHoursId(null);
      fetchHoursSaved();
    } catch {}
  };

  const handleDeleteHours = async (id: string) => {
    try {
      await fetch("/api/hours-saved", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      fetchHoursSaved();
    } catch {}
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

  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleTriggerSync = async (endpoint: string) => {
    setSyncStatus("Syncing...");
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus(`Synced! ${data.synced ?? 0} new submissions found. Period: ${data.weekLabel ?? "—"}`);
      } else {
        setSyncStatus(`Error: ${data.error ?? res.statusText}`);
      }
      if (endpoint.includes("demos")) fetchVoting();
      if (endpoint.includes("people")) fetchPeople();
    } catch (err) {
      setSyncStatus(`Failed: ${err instanceof Error ? err.message : "network error"}`);
    }
    setTimeout(() => setSyncStatus(null), 8000);
  };

  return (
    <div className="pt-10 animate-in max-w-4xl">
      <h1 className="text-xl font-bold tracking-tight mb-1">Admin Panel</h1>
      <p className="text-text-secondary text-sm mb-8">
        Manage mountain progress, voting, and configuration.
      </p>

      {/* Quick actions */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
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
        {syncStatus && (
          <span className={`text-xs font-medium px-3 py-1.5 rounded-lg border ${
            syncStatus.startsWith("Error") || syncStatus.startsWith("Failed")
              ? "text-red bg-red/10 border-red/20"
              : syncStatus === "Syncing..."
                ? "text-text-secondary bg-surface border-border"
                : "text-green bg-green/10 border-green/20"
          }`}>
            {syncStatus}
          </span>
        )}
      </div>

      {/* Hours Saved by Team */}
      <section className="mb-10">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Hours Saved by Team</h2>
        <p className="text-xs text-text-secondary mb-4">
          Enter estimated hours per team per week. These totals drive the mountain climb, scoreboard Hours Saved YTD, $$$ Delivered YTD, and HC Avoided.
        </p>

        {/* Team totals grid — always shows all 6 teams */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {ORG_CONFIGS.map((org) => {
            const total = hoursTotals[org.slug] ?? 0;
            return (
              <div key={org.slug} className="bg-surface border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-text-secondary font-medium mb-1">{org.label}</p>
                <p className="text-lg font-bold text-text tabular-nums">{total > 0 ? `${(total / 1000).toFixed(0)}K` : "0"}</p>
                <p className="text-[10px] text-text-secondary/60 mt-0.5">of {((org as { hoursTarget?: number }).hoursTarget ? `${(((org as { hoursTarget?: number }).hoursTarget ?? 0) / 1000).toFixed(0)}K target` : "—")}</p>
              </div>
            );
          })}
        </div>

        {/* Grand total */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-accent-light">Total Hours Saved</span>
          <span className="text-xl font-bold text-accent-light tabular-nums">
            {(Object.values(hoursTotals).reduce((s, h) => s + h, 0) / 1000).toFixed(0)}K
            <span className="text-sm font-normal text-accent-light/60 ml-1">/ 501K</span>
          </span>
        </div>

        {/* Add new entry */}
        <div className="rounded-xl border border-border bg-surface p-4 mb-4">
          <p className="text-xs font-semibold text-text mb-3">Add Weekly Hours</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
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
              placeholder="Week of (e.g., Mar 24)"
              value={hoursWeek}
              onChange={(e) => setHoursWeek(e.target.value)}
              className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Hours"
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
            <button
              onClick={handleAddHours}
              disabled={hoursLoading || !hoursWeek || !hoursAmount}
              className="px-4 py-2 bg-accent/15 text-accent-light text-sm font-medium rounded-lg hover:bg-accent/25 border border-accent/20 transition-all disabled:opacity-50"
            >
              {hoursLoading ? "Adding..." : "Add"}
            </button>
          </div>
        </div>

        {/* Full ledger */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-text-secondary uppercase tracking-wider border-b border-border">
                <th className="text-left p-3 font-semibold">Team</th>
                <th className="text-left p-3 font-semibold">Week</th>
                <th className="text-right p-3 font-semibold">Hours</th>
                <th className="text-left p-3 font-semibold">Note</th>
                <th className="text-left p-3 font-semibold">Added</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hoursEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-text-secondary text-xs">
                    No entries yet. Add hours above to get started.
                  </td>
                </tr>
              )}
              {hoursEntries.map((entry) => {
                const orgLabel = ORG_CONFIGS.find((c) => c.slug === entry.org_slug)?.label ?? entry.org_slug;
                const isEditing = editingHoursId === entry.id;
                return (
                  <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-2/50">
                    <td className="p-3 text-text font-medium">{orgLabel}</td>
                    <td className="p-3 text-text">{entry.week_label}</td>
                    <td className="p-3 text-right tabular-nums">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editHoursValue}
                          onChange={(e) => setEditHoursValue(e.target.value)}
                          className="bg-bg border border-accent/50 rounded-md px-2 py-1 text-sm text-text w-24 text-right focus:outline-none"
                        />
                      ) : (
                        <span className="text-accent-light font-medium">{entry.hours.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="p-3 text-text-secondary text-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editNoteValue}
                          onChange={(e) => setEditNoteValue(e.target.value)}
                          placeholder="Note"
                          className="bg-bg border border-border rounded-md px-2 py-1 text-sm text-text w-full focus:outline-none focus:border-accent/50"
                        />
                      ) : (
                        entry.note ?? "—"
                      )}
                    </td>
                    <td className="p-3 text-text-secondary text-xs">
                      {new Date(entry.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleEditHours(entry.id)}
                            className="px-2 py-1 bg-green/15 text-green text-xs rounded-md border border-green/20 hover:bg-green/25"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingHoursId(null)}
                            className="px-2 py-1 bg-surface-2 text-text-secondary text-xs rounded-md border border-border hover:text-text"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => {
                              setEditingHoursId(entry.id);
                              setEditHoursValue(String(entry.hours));
                              setEditNoteValue(entry.note ?? "");
                            }}
                            className="px-2 py-1 bg-surface-2 text-text-secondary text-xs rounded-md border border-border hover:text-text"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHours(entry.id)}
                            className="px-2 py-1 bg-red/10 text-red text-xs rounded-md border border-red/20 hover:bg-red/20"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
