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

          {/* ═══ SNOW — covers top ~40% of the mountain ═══ */}
          {/* Large snow field clipped to mountain shape */}
          <clipPath id="snowClip">
            <path d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z" />
          </clipPath>
          {/* Main snow blanket — covers from ~500,100 to the peak */}
          <path
            d="M480,110 L500,100 L530,88 L560,78 L580,72 L610,62 L640,52 L670,44 L700,36 L720,30 L750,25 L780,28 L800,32 L800,50 L785,38 L760,32 L740,30 L720,34 L700,40 L680,48 L660,54 L640,58 L620,65 L600,72 L580,78 L560,84 L540,92 L520,98 L500,106 L490,112 Z"
            fill="#c8d8e8"
            opacity="0.18"
            clipPath="url(#snowClip)"
          />
          {/* Bright snow on the ridge line itself */}
          <path
            d="M580,72 L610,62 L640,52 L670,44 L700,36 L720,30 L750,25 L780,28 L800,32 L795,36 L775,32 L755,28 L735,30 L715,34 L695,40 L675,47 L655,54 L635,60 L615,66 L595,73 Z"
            fill="#ffffff"
            opacity="0.2"
          />
          {/* Peak snow — brightest */}
          <path
            d="M700,36 L720,30 L750,25 L780,28 L800,32 L795,35 L770,30 L745,27 L725,32 L708,38 Z"
            fill="#ffffff"
            opacity="0.35"
          />
          {/* Snow drifts and patches scattered across upper face */}
          <path d="M720,32 L740,28 L755,30 L742,34 Z" fill="#ffffff" opacity="0.25" />
          <path d="M690,42 L710,36 L725,39 L708,44 Z" fill="#ffffff" opacity="0.2" />
          <path d="M660,52 L680,46 L692,50 L674,55 Z" fill="#ffffff" opacity="0.15" />
          <path d="M630,62 L650,55 L665,59 L648,65 Z" fill="#ffffff" opacity="0.12" />
          <path d="M600,74 L618,67 L632,71 L616,77 Z" fill="#ffffff" opacity="0.1" />
          <path d="M565,86 L585,78 L598,82 L580,89 Z" fill="#ffffff" opacity="0.08" />
          <path d="M530,98 L548,91 L562,95 L546,101 Z" fill="#ffffff" opacity="0.06" />
          <path d="M500,108 L515,102 L528,106 L514,112 Z" fill="#ffffff" opacity="0.05" />
          {/* Wispy snow trails */}
          <path d="M750,26 C740,30 730,28 720,32" stroke="#ffffff" strokeWidth="1" fill="none" opacity="0.15" />
          <path d="M700,38 C690,42 678,40 668,46" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.1" />
          <path d="M650,50 C640,54 628,52 618,58" stroke="#ffffff" strokeWidth="0.6" fill="none" opacity="0.08" />

          {/* ═══ RIDGES & ROCK DETAIL ═══ */}
          {/* Major ridge lines following the slope */}
          <line x1="150" y1="240" x2="350" y2="162" stroke="#ffffff" strokeWidth="0.5" opacity="0.06" />
          <line x1="250" y1="200" x2="450" y2="128" stroke="#ffffff" strokeWidth="0.4" opacity="0.05" />
          <line x1="350" y1="168" x2="550" y2="90" stroke="#ffffff" strokeWidth="0.5" opacity="0.05" />
          <line x1="450" y1="135" x2="620" y2="65" stroke="#ffffff" strokeWidth="0.4" opacity="0.04" />
          {/* Dark crevasses */}
          <line x1="320" y1="165" x2="340" y2="180" stroke="#100c08" strokeWidth="1" opacity="0.2" />
          <line x1="420" y1="132" x2="438" y2="148" stroke="#100c08" strokeWidth="0.8" opacity="0.18" />
          <line x1="520" y1="100" x2="535" y2="112" stroke="#100c08" strokeWidth="0.7" opacity="0.15" />
          <line x1="610" y1="65" x2="622" y2="76" stroke="#100c08" strokeWidth="0.6" opacity="0.12" />

          {/* Scattered rocks/boulders */}
          <ellipse cx="180" cy="226" rx="6" ry="3" fill="#2a2018" opacity="0.5" />
          <ellipse cx="300" cy="172" rx="5" ry="3" fill="#2a2018" opacity="0.4" />
          <ellipse cx="440" cy="130" rx="4" ry="2" fill="#2a2018" opacity="0.35" />
          <ellipse cx="550" cy="86" rx="4" ry="2.5" fill="#2a2018" opacity="0.3" />
          <circle cx="130" cy="246" r="3" fill="#3d3025" opacity="0.5" />
          <circle cx="250" cy="194" r="2.5" fill="#3d3025" opacity="0.4" />
          <circle cx="380" cy="147" r="3" fill="#3d3025" opacity="0.4" />
          <circle cx="510" cy="100" r="2" fill="#4a3828" opacity="0.5" />
          <circle cx="640" cy="54" r="2" fill="#4a3828" opacity="0.4" />

          {/* ═══ BASE CAMP — clearly visible at bottom-left ═══ */}
          <g transform="translate(30, 260)">
            {/* Flat ground area */}
            <ellipse cx="30" cy="22" rx="40" ry="4" fill="#2a2018" opacity="0.4" />
            {/* Tent 1 — orange accent tent (largest) */}
            <polygon points="8,20 22,0 36,20" fill="#4a3020" stroke="#E67E22" strokeWidth="1" opacity="0.8" />
            <line x1="22" y1="0" x2="22" y2="20" stroke="#E67E22" strokeWidth="0.5" opacity="0.4" />
            {/* Tent 2 — smaller */}
            <polygon points="40,20 50,6 60,20" fill="#3d2a18" stroke="#8b8b9e" strokeWidth="0.7" opacity="0.7" />
            {/* Flag pole on tent 1 */}
            <line x1="22" y1="0" x2="22" y2="-8" stroke="#8b8b9e" strokeWidth="0.8" />
            <path d="M22,-8 L30,-6 L22,-4 Z" fill="var(--color-accent)" opacity="0.9" />
            {/* Campfire glow */}
            <circle cx="48" cy="18" r="2" fill="#E67E22" opacity="0.3" />
            <circle cx="48" cy="18" r="1" fill="#F0A050" opacity="0.5" />
          </g>
          {/* Base camp label — bigger, more visible */}
          <text x="60" y="252" textAnchor="middle" fill="var(--color-text-secondary)" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif" opacity="0.6" letterSpacing="1">
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

          {/* Speech bubble when goat is clicked — positioned well above the goat */}
          {goatMessage && (() => {
            const bubbleW = 240;
            const bubbleH = 40;
            // Position bubble 55px above the goat (goat is at goatY-18, so bubble bottom at goatY-55)
            const bubbleBottom = goatY - 55;
            const bubbleY = Math.max(4, bubbleBottom - bubbleH);
            const bubbleX = Math.max(8, Math.min(goatX - bubbleW / 2, 800 - bubbleW - 8));
            // Clamp pointer x within the bubble
            const pointerX = Math.max(bubbleX + 16, Math.min(goatX, bubbleX + bubbleW - 16));
            return (
              <g>
                {/* Shadow */}
                <rect
                  x={bubbleX + 2}
                  y={bubbleY + 2}
                  width={bubbleW}
                  height={bubbleH}
                  rx="12"
                  fill="#000"
                  opacity="0.3"
                />
                {/* Bubble body */}
                <rect
                  x={bubbleX}
                  y={bubbleY}
                  width={bubbleW}
                  height={bubbleH}
                  rx="12"
                  fill="var(--color-surface-2)"
                  stroke="var(--color-accent)"
                  strokeWidth="1.5"
                />
                {/* Pointer triangle — below bubble, pointing at goat */}
                <polygon
                  points={`${pointerX - 7},${bubbleY + bubbleH - 1} ${pointerX + 7},${bubbleY + bubbleH - 1} ${pointerX},${bubbleY + bubbleH + 10}`}
                  fill="var(--color-surface-2)"
                  stroke="var(--color-accent)"
                  strokeWidth="1.5"
                />
                {/* Cover the triangle's top edge overlap */}
                <rect x={pointerX - 8} y={bubbleY + bubbleH - 3} width="16" height="4" fill="var(--color-surface-2)" />
                {/* Text */}
                <text
                  x={bubbleX + bubbleW / 2}
                  y={bubbleY + bubbleH / 2 + 5}
                  textAnchor="middle"
                  fontSize="13"
                  fill="var(--color-text)"
                  fontFamily="Inter, sans-serif"
                  fontWeight="700"
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
