"use client";

import { useEffect, useState } from "react";

interface ProgressData {
  currentHours: number;
  target: number;
  percentage: number;
}

const CAMPS = [
  { label: "100K", hours: 100000 },
  { label: "200K", hours: 200000 },
  { label: "300K", hours: 300000 },
  { label: "400K", hours: 400000 },
  { label: "501K", hours: 501000 },
];

export function MountainViz() {
  const [data, setData] = useState<ProgressData | null>(null);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const pct = Math.min(data.percentage, 100);
  const currentK = Math.round(data.currentHours / 1000);

  // Goat position along the mountain path (0-100%)
  const goatX = 80 + (pct / 100) * 620; // from x=80 to x=700

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden mb-6">
      <div className="p-5 pb-3">
        <svg viewBox="0 0 800 200" className="w-full h-auto" aria-label={`Mountain progress: ${currentK}K of 501K hours`}>
          {/* Mountain gradient fill */}
          <defs>
            <linearGradient id="mountainGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="var(--color-surface-2)" />
              <stop offset="100%" stopColor="#2a1f0f" />
            </linearGradient>
            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--color-accent-light)" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Mountain silhouette */}
          <path
            d="M0,180 L60,160 L120,140 L200,110 L300,85 L400,60 L500,40 L600,25 L700,15 L750,12 L800,15 L800,200 L0,200 Z"
            fill="url(#mountainGrad)"
            stroke="var(--color-border)"
            strokeWidth="1"
          />

          {/* Snow cap at peak */}
          <path
            d="M680,20 L700,15 L750,12 L800,15 L790,18 L760,16 L730,19 Z"
            fill="url(#snowGrad)"
          />

          {/* Progress fill */}
          <clipPath id="mountainClip">
            <path d="M0,180 L60,160 L120,140 L200,110 L300,85 L400,60 L500,40 L600,25 L700,15 L750,12 L800,15 L800,200 L0,200 Z" />
          </clipPath>
          <rect
            x="0"
            y="0"
            width={goatX}
            height="200"
            fill="url(#progressGrad)"
            clipPath="url(#mountainClip)"
          />

          {/* Camp markers */}
          {CAMPS.map((camp, i) => {
            const cx = 80 + (camp.hours / 501000) * 620;
            // y follows the mountain path
            const cy = 180 - (camp.hours / 501000) * 168;
            const reached = data.currentHours >= camp.hours;
            return (
              <g key={camp.label}>
                {/* Marker line */}
                <line
                  x1={cx} y1={cy} x2={cx} y2={cy + 12}
                  stroke={reached ? "var(--color-accent-light)" : "var(--color-border)"}
                  strokeWidth="1.5"
                  strokeDasharray={reached ? "none" : "3,2"}
                />
                {/* Camp dot */}
                <circle
                  cx={cx} cy={cy}
                  r={reached ? 4 : 3}
                  fill={reached ? "var(--color-accent-light)" : "var(--color-surface-2)"}
                  stroke={reached ? "var(--color-accent)" : "var(--color-border)"}
                  strokeWidth="1.5"
                />
                {/* Label */}
                <text
                  x={cx} y={cy - 8}
                  textAnchor="middle"
                  fill={reached ? "var(--color-accent-light)" : "var(--color-text-secondary)"}
                  fontSize="10"
                  fontWeight={i === CAMPS.length - 1 ? "700" : "500"}
                  fontFamily="Inter, sans-serif"
                >
                  {camp.label}
                </text>
              </g>
            );
          })}

          {/* Goat icon at current position */}
          <text
            x={goatX}
            y={180 - (pct / 100) * 168 - 2}
            textAnchor="middle"
            fontSize="18"
            className="animate-goat-bob"
          >
            🐐
          </text>
        </svg>
      </div>

      {/* Progress bar + stats */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text">
            ~{currentK}K / 501K estimated hours saved
          </span>
          <span className="text-sm font-bold text-accent-light tabular-nums">
            {pct}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface-2 border border-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-light))",
            }}
          />
        </div>
        <p className="text-[0.68rem] text-text-secondary mt-2">
          Estimated cumulative hours — updated weekly
        </p>
      </div>
    </div>
  );
}
