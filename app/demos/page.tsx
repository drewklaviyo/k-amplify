"use client";

import { useEffect, useState, useCallback } from "react";
import type { OrgSlug } from "@/lib/types";
import type { SubmissionWithVotes, VotingPeriod, Vote, Award } from "@/lib/supabase-types";
import { OrgFilter } from "@/components/org-filter";
import { DemoSubmissionCard } from "@/components/demo-submission-card";
import { VotingStatus } from "@/components/voting-status";
import { SummitBoard } from "@/components/summit-board";
import { HowVotingWorks } from "@/components/how-voting-works";
import { CardSkeleton } from "@/components/skeleton";

type Tab = "this-week" | "archive" | "summit-board";

export default function DemosPage() {
  const [tab, setTab] = useState<Tab>("this-week");
  const [filter, setFilter] = useState<OrgSlug | "all">("all");
  const [submissions, setSubmissions] = useState<SubmissionWithVotes[]>([]);
  const [archiveSubmissions, setArchiveSubmissions] = useState<SubmissionWithVotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  // Voting state
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [userBuilderVote, setUserBuilderVote] = useState<string | null>(null);
  const [userLearnerVote, setUserLearnerVote] = useState<string | null>(null);
  const [votingOpen, setVotingOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<VotingPeriod | null>(null);

  // Archive state
  const [archivePeriods, setArchivePeriods] = useState<VotingPeriod[]>([]);
  const [selectedArchivePeriod, setSelectedArchivePeriod] = useState<string>("all");
  const [winnersOnly, setWinnersOnly] = useState(false);

  // Load email from cookie on mount
  useEffect(() => {
    const savedEmail = document.cookie
      .split("; ")
      .find((c) => c.startsWith("bka_user_email="))
      ?.split("=")[1];
    const savedName = document.cookie
      .split("; ")
      .find((c) => c.startsWith("bka_user_name="))
      ?.split("=")[1];
    if (savedEmail) {
      setUserEmail(decodeURIComponent(savedEmail));
      setUserName(savedName ? decodeURIComponent(savedName) : null);
    }
  }, []);

  // Fetch voting period
  useEffect(() => {
    fetch("/api/voting-period")
      .then((r) => r.json())
      .then((d) => {
        if (d.period) {
          setCurrentPeriod(d.period);
          setVotingOpen(d.period.status === "open");
        }
      })
      .catch(() => {});
  }, []);

  // Fetch user's votes
  useEffect(() => {
    if (!userEmail) return;
    fetch(`/api/votes/status?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((d) => {
        const votes: Vote[] = d.votes ?? [];
        const bv = votes.find((v) => v.category === "builder");
        const lv = votes.find((v) => v.category === "learner");
        setUserBuilderVote(bv?.submission_id ?? null);
        setUserLearnerVote(lv?.submission_id ?? null);
      })
      .catch(() => {});
  }, [userEmail]);

  // Fetch this week's submissions from Supabase via the existing demos API
  // and also from Supabase directly for vote counts
  const fetchThisWeek = useCallback(async () => {
    setLoading(true);
    try {
      if (!currentPeriod) {
        setSubmissions([]);
        return;
      }
      const res = await fetch(`/api/demos?supabase=1&periodId=${currentPeriod.id}`);
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPeriod]);

  useEffect(() => {
    if (tab === "this-week") {
      fetchThisWeek();
    }
  }, [tab, currentPeriod, fetchThisWeek]);

  // Fetch archive data
  useEffect(() => {
    if (tab !== "archive") return;
    setLoading(true);

    const fetchArchive = async () => {
      try {
        const [subsRes, awardsRes] = await Promise.all([
          fetch("/api/demos?supabase=1&all=1"),
          fetch("/api/awards"),
        ]);
        const subsData = await subsRes.json();
        const awardsData = await awardsRes.json();

        // Mark winners
        const awards: Award[] = awardsData.awards ?? [];
        const subs: SubmissionWithVotes[] = (subsData.submissions ?? []).map(
          (s: SubmissionWithVotes) => ({
            ...s,
            is_builder_winner: awards.some(
              (a) => a.submission_id === s.id && a.category === "builder",
            ),
            is_learner_winner: awards.some(
              (a) => a.submission_id === s.id && a.category === "learner",
            ),
          }),
        );

        setArchiveSubmissions(subs);

        // Extract unique periods
        const periodsRes = await fetch("/api/voting-period");
        const periodsData = await periodsRes.json();
        // For now use the current period; a full archive would need a list endpoint
        // We'll use the submission data to build period list
        const periodIds = new Set(subs.map((s: SubmissionWithVotes) => s.voting_period_id).filter(Boolean));
        // Basic archive period list
        setArchivePeriods([]);
      } catch {
        setArchiveSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArchive();
  }, [tab]);

  const handleIdentify = () => {
    if (!emailInput.endsWith("@klaviyo.com")) return;
    const email = emailInput.toLowerCase().trim();
    const name = nameInput.trim() || email;
    document.cookie = `bka_user_email=${encodeURIComponent(email)}; path=/; max-age=${30 * 86400}`;
    document.cookie = `bka_user_name=${encodeURIComponent(name)}; path=/; max-age=${30 * 86400}`;
    setUserEmail(email);
    setUserName(name);
  };

  const handleVote = (submissionId: string, category: "builder" | "learner") => {
    if (category === "builder") setUserBuilderVote(submissionId);
    else setUserLearnerVote(submissionId);

    // Optimistically update vote counts
    setSubmissions((prev) =>
      prev.map((s) => {
        if (category === "builder") {
          // Remove vote from previous selection
          if (userBuilderVote === s.id && s.id !== submissionId) {
            return { ...s, builder_votes: Math.max(0, s.builder_votes - 1) };
          }
          if (s.id === submissionId && userBuilderVote !== submissionId) {
            return { ...s, builder_votes: s.builder_votes + 1 };
          }
        } else {
          if (userLearnerVote === s.id && s.id !== submissionId) {
            return { ...s, learner_votes: Math.max(0, s.learner_votes - 1) };
          }
          if (s.id === submissionId && userLearnerVote !== submissionId) {
            return { ...s, learner_votes: s.learner_votes + 1 };
          }
        }
        return s;
      }),
    );
  };

  // Filter submissions
  const filteredSubmissions = (tab === "this-week" ? submissions : archiveSubmissions).filter(
    (s) => {
      if (filter !== "all" && s.org_slug !== filter) return false;
      if (tab === "archive" && winnersOnly && !s.is_builder_winner && !s.is_learner_winner) return false;
      return true;
    },
  );

  // Sort by total votes (this week) or date (archive)
  const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    if (tab === "this-week") {
      const aTotal = a.builder_votes + a.learner_votes;
      const bTotal = b.builder_votes + b.learner_votes;
      return bTotal - aTotal;
    }
    return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
  });

  return (
    <div className="pt-10 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold tracking-tight">Demos</h1>
        <button
          onClick={() => setShowHelp(true)}
          className="h-7 px-2 rounded-full border border-border bg-surface-2 text-text-secondary hover:text-text hover:border-accent/30 transition-all text-xs font-bold flex items-center justify-center gap-1"
          aria-label="How do GOAT awards work?"
        >
          🐐 ?
        </button>
      </div>
      <p className="text-text-secondary text-sm mb-6">
        Loom walkthroughs from project updates and issue comments.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6" role="tablist">
        {[
          { id: "this-week" as Tab, label: "This Week" },
          { id: "archive" as Tab, label: "Archive" },
          { id: "summit-board" as Tab, label: "Summit Board" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            role="tab"
            aria-selected={tab === t.id}
            className={`text-[0.78rem] font-medium px-3 py-1.5 rounded-lg transition-all border ${
              tab === t.id
                ? "text-accent-light bg-accent/12 border-accent/25 shadow-sm"
                : "text-text-secondary bg-surface border-border hover:text-text hover:bg-surface-2"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "summit-board" ? (
        <SummitBoard />
      ) : (
        <>
          {/* Email identification (pre-Okta) */}
          {tab === "this-week" && !userEmail && (
            <div className="rounded-xl border border-border bg-surface p-4 mb-6">
              <p className="text-sm font-medium text-text mb-3">Enter your email to vote</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Your name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none w-40"
                />
                <input
                  type="email"
                  placeholder="you@klaviyo.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleIdentify()}
                  className="bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-secondary/50 focus:border-accent/50 focus:outline-none flex-1 min-w-[200px]"
                />
                <button
                  onClick={handleIdentify}
                  disabled={!emailInput.endsWith("@klaviyo.com")}
                  className="px-4 py-2 bg-accent/15 text-accent-light text-sm font-medium rounded-lg hover:bg-accent/25 border border-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start voting
                </button>
              </div>
            </div>
          )}

          {/* Voting status banner */}
          {tab === "this-week" && <VotingStatus />}

          {/* Org filter */}
          <div className="mb-6">
            <OrgFilter selected={filter} onChange={setFilter} />
          </div>

          {/* Archive filters */}
          {tab === "archive" && (
            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={winnersOnly}
                  onChange={(e) => setWinnersOnly(e.target.checked)}
                  className="rounded"
                />
                Winners only
              </label>
            </div>
          )}

          {/* Submissions */}
          {loading ? (
            <div>
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : sortedSubmissions.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-surface-2 mb-4">
                <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              </div>
              <p className="text-text-secondary text-sm font-medium mb-1">
                {tab === "this-week"
                  ? "No demos posted this week yet"
                  : "No demos found"}
              </p>
              <p className="text-text-secondary/60 text-xs">
                {tab === "this-week"
                  ? "Post a Loom to any Linear project update or issue comment — it'll appear here within 30 minutes."
                  : "Demos will appear once they've been synced."}
              </p>
            </div>
          ) : (
            <div className="animate-in">
              {sortedSubmissions.map((sub) => (
                <DemoSubmissionCard
                  key={sub.id}
                  submission={sub}
                  userBuilderVote={userBuilderVote}
                  userLearnerVote={userLearnerVote}
                  userEmail={userEmail}
                  userName={userName}
                  votingOpen={votingOpen}
                  showVoting={tab === "this-week"}
                  onVote={handleVote}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* How Voting Works slide-out */}
      {showHelp && <HowVotingWorks onClose={() => setShowHelp(false)} />}
    </div>
  );
}
