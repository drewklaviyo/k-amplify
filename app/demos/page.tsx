"use client";

import { useEffect, useState, useCallback } from "react";
import type { OrgSlug } from "@/lib/types";
import type { SubmissionWithVotes, VotingPeriod, Vote, Award } from "@/lib/supabase-types";
import { OrgFilter } from "@/components/org-filter";
import { DemoSubmissionCard } from "@/components/demo-submission-card";
import { VotingStatus } from "@/components/voting-status";
import { SummitBoard } from "@/components/summit-board";
import { HowVotingWorks } from "@/components/how-voting-works";
import { useLayout } from "@/components/layout-context";
import { CardSkeleton } from "@/components/skeleton";

type Tab = "this-week" | "archive" | "summit-board";

export default function DemosPage() {
  const { setWide } = useLayout();

  // Use wide layout for demos
  useEffect(() => {
    setWide(true);
    return () => { setWide(false); };
  }, [setWide]);

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

  // Likes state
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Archive state
  const [archivePeriods, setArchivePeriods] = useState<VotingPeriod[]>([]);
  const [selectedArchivePeriod, setSelectedArchivePeriod] = useState<string>("all");
  const [winnersOnly, setWinnersOnly] = useState(false);

  // Load user from Okta session (fallback to cookie for backwards compat)
  useEffect(() => {
    fetch("/api/auth/session-info")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.email) {
          setUserEmail(d.user.email);
          setUserName(d.user.name ?? d.user.email);
        } else {
          // Fallback to cookie
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
        }
      })
      .catch(() => {});
  }, []);

  // Fetch likes
  useEffect(() => {
    const email = userEmail ?? "";
    fetch(`/api/likes?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        setLikeCounts(d.likeCounts ?? {});
        setUserLikes(new Set(d.userLikes ?? []));
      })
      .catch(() => {});
  }, [userEmail]);

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

  const handleLike = (submissionId: string) => {
    const wasLiked = userLikes.has(submissionId);
    setUserLikes((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(submissionId);
      else next.add(submissionId);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [submissionId]: (prev[submissionId] ?? 0) + (wasLiked ? -1 : 1),
    }));
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
          {/* Voting status banner */}
          {tab === "this-week" && <VotingStatus submissions={submissions} />}

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
          ) : tab === "archive" ? (
            // Archive: compact grid grouped by week
            <div className="animate-in">
              {(() => {
                // Group by week (Mon-Sun based on posted_at)
                const weekGroups = new Map<string, SubmissionWithVotes[]>();
                for (const sub of sortedSubmissions) {
                  const d = new Date(sub.posted_at);
                  const day = d.getUTCDay();
                  const mon = new Date(d);
                  mon.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
                  const label = mon.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
                  const key = `Week of ${label}`;
                  if (!weekGroups.has(key)) weekGroups.set(key, []);
                  weekGroups.get(key)!.push(sub);
                }
                return Array.from(weekGroups.entries()).map(([week, subs]) => (
                  <div key={week} className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{week}</h3>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-text-secondary">{subs.length} demo{subs.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subs.map((sub) => (
                        <a
                          key={sub.id}
                          href={sub.loom_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-surface border border-border rounded-xl p-3 hover:border-accent/30 hover:bg-surface-2/50 transition-all group block"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="text-lg shrink-0 mt-0.5">🎬</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-text truncate group-hover:text-accent-light transition-colors">{sub.title}</p>
                              <p className="text-xs text-text-secondary mt-0.5">{sub.submitter_name}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-text-secondary/60">
                                  {new Date(sub.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                                {(sub.builder_votes > 0 || sub.learner_votes > 0) && (
                                  <span className="text-[10px] text-accent-light/70">
                                    {sub.builder_votes + sub.learner_votes} vote{sub.builder_votes + sub.learner_votes !== 1 ? "s" : ""}
                                  </span>
                                )}
                                {(sub.is_builder_winner || sub.is_learner_winner) && (
                                  <span className="text-[10px] font-semibold text-accent-light">🐐 Winner</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="animate-in grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  likeCount={likeCounts[sub.id] ?? 0}
                  isLiked={userLikes.has(sub.id)}
                  onLike={handleLike}
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
