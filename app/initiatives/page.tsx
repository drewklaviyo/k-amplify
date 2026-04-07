"use client";

import { useEffect, useState } from "react";
import { usePageTitle } from "@/lib/use-page-title";
import {
  INITIATIVE_LIST,
  INITIATIVE_DETAILS,
  ORG_CONFIGS,
  INITIATIVES,
} from "@/lib/config";
import { MarkdownContent } from "@/components/markdown-content";
import Link from "next/link";
import type { InitiativeSlug } from "@/lib/types";
import type { InitiativeUpdateData } from "@/app/api/initiatives/route";

const UPDATE_COLLAPSE_THRESHOLD = 400;

function HealthDot({ health }: { health: string | null }) {
  const color =
    health === "onTrack"
      ? "bg-green"
      : health === "atRisk"
        ? "bg-orange"
        : health === "offTrack"
          ? "bg-red"
          : "bg-text-secondary/40";
  return <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${color}`} />;
}

function healthLabel(health: string | null): string | null {
  if (health === "onTrack") return "On Track";
  if (health === "atRisk") return "At Risk";
  if (health === "offTrack") return "Off Track";
  return null;
}

function healthTextColor(health: string | null): string {
  if (health === "onTrack") return "text-green";
  if (health === "atRisk") return "text-orange";
  if (health === "offTrack") return "text-red";
  return "text-text-secondary";
}

export default function InitiativesPage() {
  usePageTitle("Initiatives");
  const [updates, setUpdates] = useState<Record<string, InitiativeUpdateData>>(
    {}
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/initiatives")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, InitiativeUpdateData> = {};
        for (const u of d.initiatives ?? []) map[u.slug] = u;
        setUpdates(map);
      })
      .catch(() => {});
  }, []);

  const toggleExpanded = (slug: string) =>
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }));

  return (
    <div className="pt-10 animate-in">
      <div className="mb-10">
        <h1 className="text-[2.2rem] font-extrabold tracking-tight leading-tight mb-2 text-gradient">
          Initiatives
        </h1>
        <p className="text-text-secondary text-[0.92rem] max-w-lg">
          The three strategic initiatives that drive Amplify&apos;s work across
          all partner orgs.
        </p>
      </div>

      <div className="space-y-2 stagger-in">
        {INITIATIVE_LIST.map((init) => {
          const details = INITIATIVE_DETAILS[init.slug];
          const orgs = ORG_CONFIGS.filter((c) =>
            c.initiatives.includes(init.slug)
          );
          const update = updates[init.slug]?.latestUpdate;
          const initHealth = updates[init.slug]?.health ?? null;
          const isLong =
            update && update.body.length > UPDATE_COLLAPSE_THRESHOLD;
          const isExpanded = expanded[init.slug] ?? false;

          return (
            <div
              key={init.slug}
              className="border-b border-border pb-8 last:border-b-0 last:pb-0"
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-4 mb-1.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <HealthDot health={initHealth} />
                  <h2
                    className="text-[1.1rem] font-semibold tracking-tight truncate"
                    style={{ color: init.color }}
                  >
                    {init.name}
                  </h2>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-[0.82rem] text-text-secondary">
                  <span>{details.owner}</span>
                  <a
                    href={details.linearUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-text-secondary hover:text-text transition-colors"
                  >
                    Linear
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Goal */}
              <p className="text-[0.88rem] text-text-secondary leading-relaxed mb-3 ml-[18px]">
                {details.goal}
              </p>

              {/* Metadata row */}
              <div className="flex items-center gap-3 ml-[18px] mb-5 flex-wrap">
                <span className="text-[0.78rem] font-medium text-text bg-surface-2 border border-border px-2.5 py-1 rounded-md">
                  {details.targetMetric}
                </span>
                {details.keyProduct && (
                  <span className="text-[0.78rem] text-text-secondary">
                    Product: {details.keyProduct}
                  </span>
                )}
                {details.keyWork && (
                  <span className="text-[0.78rem] text-text-secondary">
                    Work: {details.keyWork}
                  </span>
                )}
                <span className="text-[0.78rem] text-text-secondary/60">|</span>
                <span className="text-[0.78rem] text-text-secondary">
                  Orgs:{" "}
                  {orgs.map((org, i) => (
                    <span key={org.slug}>
                      {i > 0 && ", "}
                      <Link
                        href={`/roadmap?team=${org.slug}`}
                        className="hover:text-text transition-colors underline decoration-border underline-offset-2 hover:decoration-text-secondary"
                      >
                        {org.label}
                      </Link>
                    </span>
                  ))}
                </span>
              </div>

              {/* Latest Update */}
              {update && (
                <div className="ml-[18px]">
                  <div className="flex items-center gap-2 text-[0.75rem] text-text-secondary mb-2">
                    <span className="font-medium uppercase tracking-wider">
                      Latest Update
                    </span>
                    <span className="text-text-secondary/30">---</span>
                    {healthLabel(update.health) && (
                      <span
                        className={`font-semibold ${healthTextColor(update.health)}`}
                      >
                        {healthLabel(update.health)}
                      </span>
                    )}
                    <span className="text-text-secondary/50">·</span>
                    <span>{update.author}</span>
                    <span className="text-text-secondary/50">·</span>
                    <span>
                      {new Date(update.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="text-[0.875rem] leading-relaxed text-text">
                    {isLong && !isExpanded ? (
                      <>
                        <MarkdownContent>
                          {update.body
                            .substring(0, UPDATE_COLLAPSE_THRESHOLD)
                            .replace(/\s\S*$/, "")
                            .trim() + "..."}
                        </MarkdownContent>
                        <button
                          onClick={() => toggleExpanded(init.slug)}
                          className="text-[0.8rem] text-text-secondary hover:text-text mt-1.5 transition-colors"
                        >
                          Show more
                        </button>
                      </>
                    ) : (
                      <>
                        <MarkdownContent>{update.body}</MarkdownContent>
                        {isLong && (
                          <button
                            onClick={() => toggleExpanded(init.slug)}
                            className="text-[0.8rem] text-text-secondary hover:text-text mt-1.5 transition-colors"
                          >
                            Show less
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Sub-initiative updates */}
              {(updates[init.slug]?.subInitiatives ?? []).filter(s => s.latestUpdate || s.name).length > 0 && (
                <div className="ml-[18px] mt-4 space-y-4">
                  {(updates[init.slug]?.subInitiatives ?? []).map((sub) => (
                    <div key={sub.name} className="border-l-2 border-accent/20 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={sub.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[0.82rem] font-medium text-text hover:text-accent-light transition-colors"
                        >
                          {sub.name}
                        </a>
                        {sub.health && healthLabel(sub.health) && (
                          <span className={`text-[0.7rem] font-semibold ${healthTextColor(sub.health)}`}>
                            {healthLabel(sub.health)}
                          </span>
                        )}
                      </div>
                      {sub.latestUpdate ? (
                        <>
                          <p className="text-[0.7rem] text-text-secondary/60 mb-1.5">
                            {sub.latestUpdate.author} · {new Date(sub.latestUpdate.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          <div className="text-[0.82rem] leading-relaxed text-text">
                            <MarkdownContent>
                              {sub.latestUpdate.body.length > 300
                                ? sub.latestUpdate.body.substring(0, 300).replace(/\s\S*$/, "").trim() + "..."
                                : sub.latestUpdate.body}
                            </MarkdownContent>
                          </div>
                        </>
                      ) : (
                        <p className="text-[0.75rem] text-text-secondary/40">No update yet</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="mt-10 border border-border rounded-lg p-5 text-[0.78rem] text-text-secondary">
        <div className="font-semibold text-text mb-2 text-xs uppercase tracking-wide">
          How Initiatives Map to Orgs
        </div>
        <div className="space-y-1.5">
          {ORG_CONFIGS.map((org) => (
            <div key={org.slug} className="flex items-center gap-2">
              <span className="text-text font-medium w-24 shrink-0">
                {org.label}
              </span>
              <div className="flex gap-1.5">
                {org.initiatives.map((slug) => {
                  const init = INITIATIVES[slug];
                  return (
                    <span
                      key={slug}
                      className="text-[0.65rem] font-semibold px-2 py-0.5 rounded-md border"
                      style={{
                        color: init.color,
                        backgroundColor: `${init.color}14`,
                        borderColor: `${init.color}33`,
                      }}
                    >
                      {init.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
