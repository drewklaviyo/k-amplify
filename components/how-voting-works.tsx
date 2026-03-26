"use client";

import { useEffect, useCallback } from "react";

interface HowVotingWorksProps {
  onClose: () => void;
}

export function HowVotingWorks({ onClose }: HowVotingWorksProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-[480px] max-w-[90vw] z-50 bg-surface border-l border-border shadow-2xl shadow-black/50 overflow-y-auto"
        style={{ animation: "slideInRight 0.25s ease-out both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="font-bold text-lg text-text">How GOAT Awards Work</h2>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-text-secondary hover:text-text hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Two awards */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-3">Two Weekly Awards</h3>
            <div className="space-y-3">
              <div className="flex gap-3 bg-bg rounded-xl p-4 border border-border">
                <span className="text-2xl">🔨</span>
                <div>
                  <p className="text-sm font-semibold text-accent-light">GOAT Builder</p>
                  <p className="text-xs text-text-secondary mt-0.5">Best thing shipped this week. Winner gets a $15 Visa gift card + 3D printed goat with a wrench.</p>
                </div>
              </div>
              <div className="flex gap-3 bg-bg rounded-xl p-4 border border-border">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-sm font-semibold text-blue">GOAT Learner</p>
                  <p className="text-xs text-text-secondary mt-0.5">Best learning shared this week. Winner gets a $15 Visa gift card + 3D printed goat with a light bulb.</p>
                </div>
              </div>
            </div>
          </div>

          {/* How to submit */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">How to Submit</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Post a Loom to any Linear project update or issue comment. It auto-appears here within 30 minutes. No form to fill out — just post and go.
            </p>
          </div>

          {/* Voting */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">Voting</h3>
            <ul className="space-y-1.5 text-xs text-text-secondary">
              <li className="flex gap-2">
                <span className="text-text-secondary/50">1.</span>
                <span>2 votes per week — one Builder, one Learner</span>
              </li>
              <li className="flex gap-2">
                <span className="text-text-secondary/50">2.</span>
                <span>Anyone with access can vote</span>
              </li>
              <li className="flex gap-2">
                <span className="text-text-secondary/50">3.</span>
                <span>Voting opens Monday, closes Friday 4:00 PM ET</span>
              </li>
              <li className="flex gap-2">
                <span className="text-text-secondary/50">4.</span>
                <span>Winners announced by noon Friday</span>
              </li>
            </ul>
          </div>

          {/* Summit Board */}
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">Summit Board</h3>
            <p className="text-xs text-text-secondary leading-relaxed mb-3">
              Cumulative awards unlock camp tiers. Reach GOAT of GOATs (12 awards) for a gold-painted goat + $100 gift card.
            </p>
            <div className="space-y-1.5">
              {[
                { emoji: "🏕️", name: "Base Camper", threshold: "1 GOAT" },
                { emoji: "🏔️", name: "Ridge Runner", threshold: "3 GOATs" },
                { emoji: "⛰️", name: "Summit Seeker", threshold: "5 GOATs" },
                { emoji: "🗻", name: "Peak Performer", threshold: "8 GOATs" },
                { emoji: "🐐👑", name: "GOAT of GOATs", threshold: "12 GOATs" },
              ].map((tier) => (
                <div key={tier.name} className="flex items-center gap-2 text-xs bg-bg rounded-lg px-3 py-2 border border-border">
                  <span>{tier.emoji}</span>
                  <span className="text-text font-medium">{tier.name}</span>
                  <span className="text-text-secondary ml-auto">{tier.threshold}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fine print */}
          <div className="border-t border-border pt-4">
            <p className="text-[10px] text-text-secondary/60 leading-relaxed">
              Hours saved are estimated — best judgment based on agent usage and time-per-task-before. These are directional, not precise measurements. Every winner names their 3D printed goat trophy.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
