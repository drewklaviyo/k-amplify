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

  // Mountain path: steeper climb from bottom-left to top-right
  // Path goes from (0,280) at base to (750,25) at peak
  const getY = (fraction: number) => 280 - fraction * 255; // steeper: 280 down to 25
  const getX = (fraction: number) => 40 + fraction * 720;

  const goatFraction = pct / 100;
  const goatX = getX(goatFraction);
  const goatY = getY(goatFraction);

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden mb-6">
      <div className="p-5 pb-3">
        <svg viewBox="0 0 800 320" className="w-full h-auto" aria-label={`Mountain progress: ${currentK}K of 501K hours`}>
          <defs>
            {/* Mountain body gradient */}
            <linearGradient id="mountainGrad" x1="0" y1="1" x2="0.3" y2="0">
              <stop offset="0%" stopColor="#1a1510" />
              <stop offset="40%" stopColor="#2a1f0f" />
              <stop offset="70%" stopColor="#3d2e1a" />
              <stop offset="100%" stopColor="#4a3828" />
            </linearGradient>
            {/* Progress fill */}
            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-accent-light)" stopOpacity="0.5" />
            </linearGradient>
            {/* Snow/ice at peak */}
            <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            {/* Rocky texture overlay */}
            <pattern id="rockTexture" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="7" r="1" fill="#ffffff" opacity="0.03" />
              <circle cx="12" cy="3" r="0.8" fill="#ffffff" opacity="0.04" />
              <circle cx="8" cy="15" r="1.2" fill="#ffffff" opacity="0.02" />
              <circle cx="17" cy="11" r="0.6" fill="#ffffff" opacity="0.05" />
              <circle cx="6" cy="18" r="0.7" fill="#ffffff" opacity="0.03" />
              <circle cx="15" cy="17" r="0.9" fill="#ffffff" opacity="0.02" />
            </pattern>
            {/* Subtle ridge lines */}
            <pattern id="ridgeLines" width="60" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)">
              <line x1="0" y1="20" x2="60" y2="20" stroke="#ffffff" strokeWidth="0.5" opacity="0.04" />
              <line x1="0" y1="35" x2="60" y2="35" stroke="#ffffff" strokeWidth="0.3" opacity="0.03" />
            </pattern>
          </defs>

          {/* Background mountain range (far, subtle) */}
          <path
            d="M0,300 L100,200 L180,220 L280,150 L350,170 L450,100 L520,120 L620,60 L700,40 L760,30 L800,35 L800,320 L0,320 Z"
            fill="#151015"
            opacity="0.5"
          />

          {/* Main mountain silhouette — steep climb */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z"
            fill="url(#mountainGrad)"
            stroke="var(--color-border)"
            strokeWidth="0.5"
          />

          {/* Rock texture overlay */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z"
            fill="url(#rockTexture)"
          />

          {/* Ridge line texture */}
          <clipPath id="mountainClipRidge">
            <path d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z" />
          </clipPath>
          <rect x="0" y="0" width="800" height="320" fill="url(#ridgeLines)" clipPath="url(#mountainClipRidge)" />

          {/* Snow cap at peak */}
          <path
            d="M700,35 L720,30 L750,25 L780,28 L800,32 L795,34 L770,30 L745,28 L725,33 Z"
            fill="url(#snowGrad)"
          />
          {/* Extra snow streaks */}
          <path d="M730,32 L745,28 L760,30 L750,33 Z" fill="#ffffff" opacity="0.1" />
          <path d="M755,27 L770,30 L780,29 L768,26 Z" fill="#ffffff" opacity="0.08" />

          {/* Scattered rocks/boulders */}
          <circle cx="120" cy="248" r="3" fill="#3d3025" opacity="0.6" />
          <circle cx="250" cy="192" r="2.5" fill="#3d3025" opacity="0.5" />
          <circle cx="380" cy="145" r="3.5" fill="#3d3025" opacity="0.5" />
          <circle cx="510" cy="98" r="2" fill="#4a3828" opacity="0.6" />
          <circle cx="640" cy="52" r="2.5" fill="#4a3828" opacity="0.5" />
          <ellipse cx="300" cy="170" rx="5" ry="3" fill="#2a2018" opacity="0.4" />
          <ellipse cx="550" cy="85" rx="4" ry="2.5" fill="#2a2018" opacity="0.4" />

          {/* Progress fill clipped to mountain */}
          <clipPath id="mountainClip">
            <path d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z" />
          </clipPath>
          <rect
            x="0"
            y="0"
            width={goatX}
            height="320"
            fill="url(#progressGrad)"
            clipPath="url(#mountainClip)"
          />

          {/* Camp markers along the ridge */}
          {CAMPS.map((camp, i) => {
            const fraction = camp.hours / 501000;
            const cx = getX(fraction);
            const cy = getY(fraction);
            const reached = data.currentHours >= camp.hours;
            return (
              <g key={camp.label}>
                <line
                  x1={cx} y1={cy} x2={cx} y2={cy + 14}
                  stroke={reached ? "var(--color-accent-light)" : "var(--color-border)"}
                  strokeWidth="1.5"
                  strokeDasharray={reached ? "none" : "3,2"}
                />
                <circle
                  cx={cx} cy={cy}
                  r={reached ? 5 : 4}
                  fill={reached ? "var(--color-accent-light)" : "var(--color-surface-2)"}
                  stroke={reached ? "var(--color-accent)" : "var(--color-border)"}
                  strokeWidth="1.5"
                />
                <text
                  x={cx} y={cy - 12}
                  textAnchor="middle"
                  fill={reached ? "var(--color-accent-light)" : "var(--color-text-secondary)"}
                  fontSize="11"
                  fontWeight={i === CAMPS.length - 1 ? "700" : "500"}
                  fontFamily="Inter, sans-serif"
                >
                  {camp.label}
                </text>
              </g>
            );
          })}

          {/* Flag at peak */}
          <g transform="translate(750, 10)">
            <line x1="0" y1="0" x2="0" y2="15" stroke="var(--color-accent-light)" strokeWidth="1.5" />
            <path d="M0,0 L12,4 L0,8 Z" fill="var(--color-accent)" opacity="0.8" />
          </g>

          {/* GOAT — bigger, walking ON TOP of the mountain ridge, facing right */}
          <g transform={`translate(${goatX}, ${goatY - 18}) scale(-1, 1)`} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fontSize="32"
              className="animate-goat-bob"
            >
              🐐
            </text>
          </g>
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
