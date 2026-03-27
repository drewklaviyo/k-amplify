"use client";

import { useEffect, useState, useCallback } from "react";

interface ProgressData {
  currentHours: number;
  target: number;
  percentage: number;
}

const GOAT_MESSAGES = [
  "Baaaa! 🐐 Keep climbing!",
  "This goat doesn't quit!",
  "501K or bust! 🏔️",
  "Every hour saved is a step up!",
  "The peak is calling! 🗻",
  "Mountain goats don't look down!",
  "Who's the GOAT? We are! 🐐👑",
  "One automation at a time...",
  "Base Camp → Summit! Let's go!",
  "Agile. Relentless. GOAT. 🐐",
];

const CAMPS = [
  { label: "100K", hours: 100000 },
  { label: "200K", hours: 200000 },
  { label: "300K", hours: 300000 },
  { label: "400K", hours: 400000 },
  { label: "501K", hours: 501000 },
];

export function MountainViz() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [goatMessage, setGoatMessage] = useState<string | null>(null);
  const [goatJumping, setGoatJumping] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  const handleGoatClick = useCallback(() => {
    // Random message
    const msg = GOAT_MESSAGES[Math.floor(Math.random() * GOAT_MESSAGES.length)];
    setGoatMessage(msg);
    setGoatJumping(true);
    setShowConfetti(true);

    // Reset after animation
    setTimeout(() => setGoatJumping(false), 600);
    setTimeout(() => setShowConfetti(false), 1500);
    setTimeout(() => setGoatMessage(null), 2500);
  }, []);

  if (!data) return null;

  const pct = Math.min(data.percentage || 0, 100);
  const currentK = Math.round((data.currentHours || 0) / 1000);

  // Mountain path: steeper climb from bottom-left to top-right
  const getY = (fraction: number) => 280 - fraction * 255;
  const getX = (fraction: number) => 40 + fraction * 720;

  // Ensure goat starts at base (minimum 2% so it's visible on the slope, not at 0,0)
  const goatFraction = Math.max(pct / 100, 0.02);
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

          {/* Snow cap at peak — larger coverage */}
          <path
            d="M680,45 L700,38 L720,30 L750,25 L780,28 L800,32 L798,36 L785,33 L770,30 L745,28 L725,33 L705,40 L690,44 Z"
            fill="url(#snowGrad)"
          />
          {/* Snow streaks extending further down the ridge */}
          <path d="M730,32 L745,28 L760,30 L750,33 Z" fill="#ffffff" opacity="0.12" />
          <path d="M755,27 L770,30 L780,29 L768,26 Z" fill="#ffffff" opacity="0.1" />
          <path d="M700,38 L715,33 L730,35 L720,39 Z" fill="#ffffff" opacity="0.08" />
          <path d="M670,50 L685,45 L700,48 L688,52 Z" fill="#ffffff" opacity="0.05" />
          <path d="M640,58 L660,52 L675,55 L658,60 Z" fill="#ffffff" opacity="0.04" />
          {/* Snow patches on upper slopes */}
          <path d="M600,72 L620,66 L635,70 L618,75 Z" fill="#ffffff" opacity="0.03" />
          <path d="M560,82 L575,77 L588,80 L572,85 Z" fill="#ffffff" opacity="0.025" />

          {/* Ridge lines — horizontal rock striations */}
          <line x1="200" y1="225" x2="320" y2="175" stroke="#ffffff" strokeWidth="0.4" opacity="0.05" />
          <line x1="280" y1="200" x2="420" y2="140" stroke="#ffffff" strokeWidth="0.3" opacity="0.04" />
          <line x1="400" y1="145" x2="540" y2="95" stroke="#ffffff" strokeWidth="0.4" opacity="0.04" />
          <line x1="500" y1="110" x2="650" y2="55" stroke="#ffffff" strokeWidth="0.3" opacity="0.05" />
          <line x1="580" y1="80" x2="720" y2="35" stroke="#ffffff" strokeWidth="0.3" opacity="0.04" />
          {/* Diagonal crevasse lines */}
          <line x1="350" y1="155" x2="370" y2="175" stroke="#1a1510" strokeWidth="0.8" opacity="0.3" />
          <line x1="480" y1="105" x2="495" y2="120" stroke="#1a1510" strokeWidth="0.6" opacity="0.25" />
          <line x1="620" y1="60" x2="632" y2="72" stroke="#1a1510" strokeWidth="0.5" opacity="0.2" />

          {/* Scattered rocks/boulders — more of them */}
          <circle cx="120" cy="248" r="3" fill="#3d3025" opacity="0.6" />
          <circle cx="180" cy="228" r="2" fill="#352a1e" opacity="0.5" />
          <circle cx="250" cy="192" r="2.5" fill="#3d3025" opacity="0.5" />
          <circle cx="320" cy="168" r="1.8" fill="#352a1e" opacity="0.4" />
          <circle cx="380" cy="145" r="3.5" fill="#3d3025" opacity="0.5" />
          <circle cx="450" cy="125" r="2" fill="#352a1e" opacity="0.45" />
          <circle cx="510" cy="98" r="2" fill="#4a3828" opacity="0.6" />
          <circle cx="575" cy="78" r="1.5" fill="#4a3828" opacity="0.4" />
          <circle cx="640" cy="52" r="2.5" fill="#4a3828" opacity="0.5" />
          <circle cx="700" cy="40" r="1.5" fill="#4a3828" opacity="0.4" />
          <ellipse cx="300" cy="170" rx="5" ry="3" fill="#2a2018" opacity="0.4" />
          <ellipse cx="440" cy="130" rx="4" ry="2" fill="#2a2018" opacity="0.35" />
          <ellipse cx="550" cy="85" rx="4" ry="2.5" fill="#2a2018" opacity="0.4" />
          <ellipse cx="680" cy="48" rx="3" ry="1.5" fill="#2a2018" opacity="0.3" />

          {/* Base camp near the bottom — small tents */}
          <g transform="translate(55, 278)" opacity="0.6">
            {/* Tent 1 */}
            <polygon points="0,0 6,-10 12,0" fill="#4a3828" stroke="#5a4838" strokeWidth="0.5" />
            <line x1="6" y1="-10" x2="6" y2="-13" stroke="#8b8b9e" strokeWidth="0.5" />
            {/* Tent 2 */}
            <polygon points="16,0 21,-8 26,0" fill="#3d2e1a" stroke="#4a3828" strokeWidth="0.5" />
            {/* Small flag */}
            <line x1="21" y1="-8" x2="21" y2="-12" stroke="#8b8b9e" strokeWidth="0.4" />
            <path d="M21,-12 L26,-11 L21,-10 Z" fill="var(--color-accent)" opacity="0.6" />
            {/* Ground line */}
            <line x1="-4" y1="0" x2="30" y2="0" stroke="#4a3828" strokeWidth="0.8" opacity="0.4" />
          </g>
          {/* Base camp label */}
          <text x="75" y="272" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="7" fontFamily="Inter, sans-serif" opacity="0.4">
            BASE CAMP
          </text>

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
                  x={cx} y={Math.max(cy - 10 - i * 2, 14)}
                  textAnchor="middle"
                  fill={reached ? "var(--color-accent-light)" : "var(--color-text-secondary)"}
                  fontSize={12 + i * 2}
                  fontWeight={i >= 3 ? "800" : "600"}
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

          {/* Confetti particles when goat is clicked */}
          {showConfetti && (
            <g>
              {[...Array(8)].map((_, i) => (
                <circle
                  key={i}
                  cx={goatX + (Math.random() - 0.5) * 60}
                  cy={goatY - 30 - Math.random() * 40}
                  r={2 + Math.random() * 3}
                  fill={["var(--color-accent)", "var(--color-accent-light)", "var(--color-green)", "#F1C40F", "#E74C3C"][i % 5]}
                  opacity="0.8"
                >
                  <animate attributeName="cy" from={goatY - 20} to={goatY - 80 - Math.random() * 40} dur="1s" fill="freeze" />
                  <animate attributeName="opacity" from="0.9" to="0" dur="1.2s" fill="freeze" />
                  <animate attributeName="cx" from={goatX} to={goatX + (Math.random() - 0.5) * 80} dur="1s" fill="freeze" />
                </circle>
              ))}
            </g>
          )}

          {/* Speech bubble when goat is clicked */}
          {goatMessage && (() => {
            const bubbleW = 220;
            const bubbleH = 36;
            const bubbleX = Math.max(10, Math.min(goatX - bubbleW / 2, 800 - bubbleW - 10));
            const bubbleY = goatY - 75;
            return (
              <g>
                <rect
                  x={bubbleX}
                  y={bubbleY}
                  width={bubbleW}
                  height={bubbleH}
                  rx="10"
                  fill="var(--color-surface)"
                  stroke="var(--color-border)"
                  strokeWidth="1"
                  opacity="0.95"
                />
                {/* Pointer triangle */}
                <polygon
                  points={`${goatX - 6},${bubbleY + bubbleH} ${goatX + 6},${bubbleY + bubbleH} ${goatX},${bubbleY + bubbleH + 8}`}
                  fill="var(--color-surface)"
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />
                <rect x={bubbleX + 1} y={bubbleY + bubbleH - 2} width={bubbleW - 2} height="4" fill="var(--color-surface)" />
                <text
                  x={bubbleX + bubbleW / 2}
                  y={bubbleY + bubbleH / 2 + 5}
                  textAnchor="middle"
                  fontSize="12"
                  fill="var(--color-text)"
                  fontFamily="Inter, sans-serif"
                  fontWeight="600"
                >
                  {goatMessage}
                </text>
              </g>
            );
          })()}

          {/* GOAT — clickable, walking ON TOP of the mountain ridge, facing right */}
          <g
            transform={`translate(${goatX}, ${goatY - 18 + (goatJumping ? -12 : 0)}) scale(-1, 1)`}
            style={{
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              cursor: "pointer",
              transition: "transform 0.15s ease-out",
            }}
            onClick={handleGoatClick}
          >
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fontSize="36"
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
