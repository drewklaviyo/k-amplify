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
import type {
  InitiativeUpdateData,
  SubInitiativeData,
  SubInitiativeChild,
} from "@/app/api/initiatives/route";

const UPDATE_COLLAPSE_THRESHOLD = 400;
const SUB_UPDATE_COLLAPSE_THRESHOLD = 300;

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

function ExternalLinkIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function getStrategyDocLink(sub: SubInitiativeData): { label: string; url: string } | null {
  if (sub.documents.length > 0) {
    return { label: sub.documents[0].title || "Strategy Doc", url: sub.documents[0].url };
  }
  if (sub.links.length > 0) {
    return { label: sub.links[0].label || "Strategy Doc", url: sub.links[0].url };
  }
  return null;
}

function LatestUpdateBlock({
  update,
  expandedKey,
  expanded,
  toggleExpanded,
  threshold,
}: {
  update: { body: string; health: string | null; date: string; author: string };
  expandedKey: string;
  expanded: Record<string, boolean>;
  toggleExpanded: (key: string) => void;
  threshold: number;
}) {
  const isLong = update.body.length > threshold;
  const isExpanded = expanded[expandedKey] ?? false;

  return (
    <div>
      <div className="flex items-center gap-2 text-[0.75rem] text-text-secondary mb-2">
        <span className="font-medium uppercase tracking-wider">Latest Update</span>
        <span className="text-text-secondary/30">---</span>
        {healthLabel(update.health) && (
          <span className={`font-semibold ${healthTextColor(update.health)}`}>
            {healthLabel(update.health)}
          </span>
        )}
        <span className="text-text-secondary/50">&middot;</span>
        <span>{update.author}</span>
        <span className="text-text-secondary/50">&middot;</span>
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
                .substring(0, threshold)
                .replace(/\s\S*$/, "")
                .trim() + "..."}
            </MarkdownContent>
            <button
              onClick={() => toggleExpanded(expandedKey)}
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
                onClick={() => toggleExpanded(expandedKey)}
                className="text-[0.8rem] text-text-secondary hover:text-text mt-1.5 transition-colors"
              >
                Show less
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SubInitiativeChildRow({ child }: { child: SubInitiativeChild }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <HealthDot health={child.health} />
      <a
        href={child.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[0.78rem] text-text hover:text-accent-light transition-colors"
      >
        {child.name}
      </a>
      <span className="text-[0.68rem] text-text-secondary">{child.owner}</span>
      {child.latestUpdate && (
        <span className="text-[0.65rem] text-text-secondary/50 ml-auto">
          Updated {new Date(child.latestUpdate.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      )}
    </div>
  );
}

function SubInitiativeCard({
  sub,
  expanded,
  toggleExpanded,
}: {
  sub: SubInitiativeData;
  expanded: Record<string, boolean>;
  toggleExpanded: (key: string) => void;
}) {
  const strategyDoc = getStrategyDocLink(sub);

  return (
    <div className="border-l-2 border-accent/20 pl-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <HealthDot health={sub.health} />
        <a
          href={sub.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.85rem] font-medium text-text hover:text-accent-light transition-colors"
        >
          {sub.name}
        </a>
        {sub.health && healthLabel(sub.health) && (
          <span className={`text-[0.7rem] font-semibold ${healthTextColor(sub.health)}`}>
            {healthLabel(sub.health)}
          </span>
        )}
      </div>

      {/* Owner + strategy doc */}
      <div className="flex items-center gap-3 mb-2 ml-[16px]">
        <span className="text-[0.75rem] text-text-secondary">{sub.owner}</span>
        {strategyDoc && (
          <>
            <span className="text-text-secondary/30">&middot;</span>
            <a
              href={strategyDoc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.75rem] text-accent-light hover:text-accent transition-colors"
            >
              Strategy Doc &rarr;
            </a>
          </>
        )}
      </div>

      {/* Latest update */}
      {sub.latestUpdate && (
        <div className="ml-[16px] mb-2">
          <LatestUpdateBlock
            update={sub.latestUpdate}
            expandedKey={`sub-${sub.id}`}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            threshold={SUB_UPDATE_COLLAPSE_THRESHOLD}
          />
        </div>
      )}
      {!sub.latestUpdate && (
        <p className="text-[0.75rem] text-text-secondary/40 ml-[16px] mb-2">No update yet</p>
      )}

      {/* Nested sub-sub-initiatives */}
      {sub.subInitiatives.length > 0 && (
        <div className="ml-[16px] mt-2 pl-3 border-l border-border/50">
          <p className="text-[0.68rem] font-medium text-text-secondary uppercase tracking-wider mb-1">
            Sub-initiatives
          </p>
          {sub.subInitiatives.map((child) => (
            <SubInitiativeChildRow key={child.id} child={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function InitiativesPage() {
  usePageTitle("Initiatives");
  const [updates, setUpdates] = useState<Record<string, InitiativeUpdateData>>({});
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

  const toggleExpanded = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="pt-10 animate-in">
      <div className="mb-10">
        <h1 className="text-[2.2rem] font-extrabold tracking-tight leading-tight mb-2 text-gradient">
          Initiatives
        </h1>
        <p className="text-text-secondary text-[0.92rem] max-w-lg">
          The three strategic initiatives that drive Amplify&apos;s work across
          all partner orgs. Sub-initiatives are auto-discovered from Linear based
          on Amplify team ownership.
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
          const subInits = updates[init.slug]?.subInitiatives ?? [];
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
                  {subInits.length > 0 && (
                    <span className="text-[0.68rem] text-text-secondary bg-surface-2 border border-border px-1.5 py-0.5 rounded-md tabular-nums">
                      {subInits.length} sub-initiative{subInits.length !== 1 ? "s" : ""}
                    </span>
                  )}
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
                    <ExternalLinkIcon />
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
                  <LatestUpdateBlock
                    update={update}
                    expandedKey={init.slug}
                    expanded={expanded}
                    toggleExpanded={toggleExpanded}
                    threshold={UPDATE_COLLAPSE_THRESHOLD}
                  />
                </div>
              )}

              {/* Sub-initiatives (auto-discovered) */}
              {subInits.length > 0 && (
                <div className="ml-[18px] mt-6 space-y-5">
                  <p className="text-[0.72rem] font-semibold text-text-secondary uppercase tracking-wider">
                    Amplify-owned sub-initiatives ({subInits.length})
                  </p>
                  {subInits.map((sub) => (
                    <SubInitiativeCard
                      key={sub.id}
                      sub={sub}
                      expanded={expanded}
                      toggleExpanded={toggleExpanded}
                    />
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
