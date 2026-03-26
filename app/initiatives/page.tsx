"use client";

import { usePageTitle } from "@/lib/use-page-title";
import {
  INITIATIVE_LIST,
  INITIATIVE_DETAILS,
  ORG_CONFIGS,
  INITIATIVES,
} from "@/lib/config";
import Link from "next/link";
import type { InitiativeSlug } from "@/lib/types";

export default function InitiativesPage() {
  usePageTitle("Initiatives");

  return (
    <div className="pt-10 animate-in">
      <div className="mb-8">
        <h1 className="text-[2.2rem] font-extrabold tracking-tight leading-tight mb-2 text-gradient">
          Initiatives
        </h1>
        <p className="text-text-secondary text-[0.92rem] max-w-lg">
          The three strategic initiatives that drive Amplify&apos;s work across
          all partner orgs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 stagger-in">
        {INITIATIVE_LIST.map((init) => {
          const details = INITIATIVE_DETAILS[init.slug];
          const orgs = ORG_CONFIGS.filter((c) =>
            c.initiatives.includes(init.slug)
          );

          return (
            <div
              key={init.slug}
              className="bg-surface border border-border rounded-xl overflow-hidden hover:border-border/80 transition-colors relative group"
            >
              {/* Colored accent bar */}
              <div
                className="h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${init.color}, ${init.color}88)`,
                }}
              />

              {/* Subtle background glow */}
              <div
                className="absolute top-0 left-0 right-0 h-24 opacity-[0.04] pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, ${init.color}, transparent)`,
                }}
              />

              <div className="relative p-6">
                {/* Initiative name */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: init.color }}
                  />
                  <h2
                    className="text-lg font-bold tracking-tight"
                    style={{ color: init.color }}
                  >
                    {init.name}
                  </h2>
                </div>

                {/* Goal */}
                <div className="mb-5">
                  <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    Goal
                  </div>
                  <p className="text-[0.88rem] font-semibold leading-snug">
                    {details.goal}
                  </p>
                </div>

                {/* Target Metric */}
                <div className="mb-5">
                  <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    Target Metric
                  </div>
                  <div
                    className="inline-flex items-center text-[0.82rem] font-bold px-3 py-1.5 rounded-lg border"
                    style={{
                      color: init.color,
                      backgroundColor: `${init.color}14`,
                      borderColor: `${init.color}25`,
                    }}
                  >
                    {details.targetMetric}
                  </div>
                </div>

                {/* Owner */}
                <div className="mb-5">
                  <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    Owner
                  </div>
                  <p className="text-[0.85rem] text-text">{details.owner}</p>
                </div>

                {/* Linear Initiative */}
                <div className="mb-5">
                  <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                    Linear Initiative
                  </div>
                  <a
                    href={details.linearUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[0.82rem] text-accent-light hover:text-accent transition-colors"
                  >
                    {details.linearInitiative}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                {/* Key Product / Key Work (if applicable) */}
                {details.keyProduct && (
                  <div className="mb-5">
                    <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                      Key Product
                    </div>
                    <p className="text-[0.82rem] text-text">
                      {details.keyProduct}
                    </p>
                  </div>
                )}
                {details.keyWork && (
                  <div className="mb-5">
                    <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-1.5">
                      Key Work
                    </div>
                    <p className="text-[0.82rem] text-text-secondary leading-relaxed">
                      {details.keyWork}
                    </p>
                  </div>
                )}

                {/* Org chips */}
                <div className="border-t border-border pt-4 mt-auto">
                  <div className="text-[0.65rem] font-semibold text-text-secondary uppercase tracking-wide mb-2.5">
                    Orgs ({orgs.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {orgs.map((org) => (
                      <Link
                        key={org.slug}
                        href={`/roadmap?team=${org.slug}`}
                        className="text-[0.72rem] font-medium px-2.5 py-1 rounded-lg border border-border bg-surface-2 text-text-secondary hover:text-text hover:border-border/80 transition-all"
                      >
                        {org.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="mt-10 bg-surface-2/50 border border-border rounded-xl p-5 text-[0.78rem] text-text-secondary">
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
