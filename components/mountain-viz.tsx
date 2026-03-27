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
            {/* Sky gradient for background */}
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0e1a" />
              <stop offset="60%" stopColor="#111827" />
              <stop offset="100%" stopColor="#1a1525" />
            </linearGradient>

            {/* Mountain BACK face — darker, shadowed side */}
            <linearGradient id="mountainBackGrad" x1="0" y1="0" x2="0.2" y2="1">
              <stop offset="0%" stopColor="#1e1a14" />
              <stop offset="30%" stopColor="#1a150e" />
              <stop offset="70%" stopColor="#13100a" />
              <stop offset="100%" stopColor="#0d0a07" />
            </linearGradient>

            {/* Mountain FRONT face — lit side with more color */}
            <linearGradient id="mountainFrontGrad" x1="0.8" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a4530" />
              <stop offset="25%" stopColor="#4a3828" />
              <stop offset="50%" stopColor="#3d2e1a" />
              <stop offset="75%" stopColor="#2a1f0f" />
              <stop offset="100%" stopColor="#1a1510" />
            </linearGradient>

            {/* Ridge highlight gradient */}
            <linearGradient id="ridgeHighlight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b5540" />
              <stop offset="100%" stopColor="#3d2e1a" />
            </linearGradient>

            {/* Progress fill */}
            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-accent-light)" stopOpacity="0.5" />
            </linearGradient>

            {/* Snow gradient — heavier at top */}
            <linearGradient id="snowHeavy" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#e8eef5" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#c0ccd8" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="snowMid" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d0dae5" stopOpacity="0.15" />
            </linearGradient>

            <linearGradient id="snowLight" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#c0ccd8" stopOpacity="0.05" />
            </linearGradient>

            {/* Shadow gradient for depth under outcrops */}
            <linearGradient id="shadowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>

            {/* Clip path for entire mountain shape */}
            <clipPath id="mountainMasterClip">
              <path d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z" />
            </clipPath>

            {/* Rock texture pattern — more visible */}
            <pattern id="rockTexture" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="5" cy="8" r="1.5" fill="#ffffff" opacity="0.06" />
              <circle cx="18" cy="4" r="1" fill="#ffffff" opacity="0.08" />
              <circle cx="10" cy="20" r="1.8" fill="#ffffff" opacity="0.04" />
              <circle cx="25" cy="14" r="0.8" fill="#ffffff" opacity="0.1" />
              <circle cx="8" cy="27" r="1.2" fill="#ffffff" opacity="0.05" />
              <circle cx="22" cy="24" r="1.4" fill="#ffffff" opacity="0.04" />
              <rect x="14" y="10" width="2" height="1" fill="#000000" opacity="0.06" rx="0.5" />
              <rect x="3" y="16" width="1.5" height="0.8" fill="#000000" opacity="0.05" rx="0.4" />
            </pattern>

            {/* Gravel/scree texture */}
            <pattern id="screeTexture" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="5" r="0.6" fill="#8a7560" opacity="0.15" />
              <circle cx="8" cy="2" r="0.8" fill="#7a6550" opacity="0.12" />
              <circle cx="14" cy="8" r="0.5" fill="#8a7560" opacity="0.1" />
              <circle cx="5" cy="12" r="0.7" fill="#6a5540" opacity="0.12" />
              <circle cx="11" cy="14" r="0.4" fill="#7a6550" opacity="0.1" />
            </pattern>

            {/* Filter for subtle glow on snow */}
            <filter id="snowGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
            </filter>
          </defs>

          {/* ═══ SKY BACKGROUND ═══ */}
          <rect x="0" y="0" width="800" height="320" fill="url(#skyGrad)" />

          {/* ═══ DISTANT MOUNTAIN RANGE (atmospheric depth) ═══ */}
          <path
            d="M0,300 L60,230 L120,245 L200,180 L260,195 L340,140 L400,155 L480,110 L540,125 L620,80 L680,65 L730,50 L760,45 L800,55 L800,320 L0,320 Z"
            fill="#0f0d18"
            opacity="0.6"
          />
          {/* Second distant peak — different silhouette */}
          <path
            d="M0,310 L80,260 L140,270 L220,210 L300,225 L380,175 L440,185 L520,140 L580,155 L640,115 L690,100 L740,92 L780,85 L800,90 L800,320 L0,320 Z"
            fill="#12101a"
            opacity="0.45"
          />

          {/* ═══ MAIN MOUNTAIN — BACK/SHADOW FACE (creates 3D depth) ═══ */}
          {/* This face sits slightly offset to create the illusion of a cliff wall below the ridge */}
          <path
            d="M0,305 L40,290 L100,265 L180,240 L260,210 L340,180 L420,150 L500,120 L580,92 L650,68 L720,48 L750,42 L780,44 L800,48 L800,320 L0,320 Z"
            fill="url(#mountainBackGrad)"
          />
          {/* Dark vertical cliff bands on the back face */}
          <path
            d="M200,240 L210,235 L215,260 L205,265 Z"
            fill="#0a0806" opacity="0.4"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M350,180 L358,176 L362,205 L354,210 Z"
            fill="#0a0806" opacity="0.35"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M500,118 L510,112 L515,145 L505,150 Z"
            fill="#0a0806" opacity="0.3"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M630,65 L638,60 L642,88 L634,92 Z"
            fill="#0a0806" opacity="0.25"
            clipPath="url(#mountainMasterClip)"
          />

          {/* ═══ MAIN MOUNTAIN — FRONT/LIT FACE (the primary visible slope) ═══ */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z"
            fill="url(#mountainFrontGrad)"
          />

          {/* Rock texture overlay on the front face */}
          <rect x="0" y="0" width="800" height="320" fill="url(#rockTexture)" clipPath="url(#mountainMasterClip)" />
          <rect x="0" y="0" width="800" height="320" fill="url(#screeTexture)" clipPath="url(#mountainMasterClip)" />

          {/* ═══ RIDGE LINE HIGHLIGHT (top edge catches light) ═══ */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32"
            fill="none"
            stroke="#7a6550"
            strokeWidth="2"
            opacity="0.5"
          />
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32"
            fill="none"
            stroke="#a08a70"
            strokeWidth="0.8"
            opacity="0.3"
          />

          {/* ═══ MAJOR ROCK RIDGES running diagonally across the face ═══ */}
          {/* Ridge 1 — lower mountain */}
          <path
            d="M60,295 L100,270 L160,245 L200,228 L220,222"
            fill="none" stroke="#5a4530" strokeWidth="2.5" opacity="0.4"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M60,297 L100,272 L160,247 L200,230 L220,224"
            fill="none" stroke="#0d0a06" strokeWidth="1.2" opacity="0.3"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Ridge 2 — mid mountain */}
          <path
            d="M180,260 L240,232 L310,200 L370,178 L420,158"
            fill="none" stroke="#5a4530" strokeWidth="2" opacity="0.35"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M180,262 L240,234 L310,202 L370,180 L420,160"
            fill="none" stroke="#0d0a06" strokeWidth="1" opacity="0.25"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Ridge 3 — upper mountain */}
          <path
            d="M350,200 L420,168 L490,138 L550,112 L600,90"
            fill="none" stroke="#5a4530" strokeWidth="1.8" opacity="0.3"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M350,202 L420,170 L490,140 L550,114 L600,92"
            fill="none" stroke="#0d0a06" strokeWidth="0.8" opacity="0.22"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Ridge 4 — near summit */}
          <path
            d="M520,140 L580,110 L640,82 L690,60 L730,42"
            fill="none" stroke="#5a4530" strokeWidth="1.5" opacity="0.25"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M520,142 L580,112 L640,84 L690,62 L730,44"
            fill="none" stroke="#0d0a06" strokeWidth="0.7" opacity="0.2"
            clipPath="url(#mountainMasterClip)"
          />

          {/* ═══ ROCK OUTCROPS with shadow underneath ═══ */}
          {/* Outcrop 1 — lower */}
          <path d="M120,258 L145,248 L155,252 L140,264 Z" fill="#3d2e1a" opacity="0.7" clipPath="url(#mountainMasterClip)" />
          <path d="M120,264 L140,264 L155,252 L158,258 L145,270 L122,272 Z" fill="#0d0a06" opacity="0.35" clipPath="url(#mountainMasterClip)" />

          {/* Outcrop 2 — mid */}
          <path d="M280,202 L310,190 L322,195 L305,210 Z" fill="#3d2e1a" opacity="0.65" clipPath="url(#mountainMasterClip)" />
          <path d="M280,210 L305,210 L322,195 L326,202 L312,216 L284,218 Z" fill="#0d0a06" opacity="0.3" clipPath="url(#mountainMasterClip)" />

          {/* Outcrop 3 — upper */}
          <path d="M440,142 L465,130 L478,135 L460,150 Z" fill="#3d2e1a" opacity="0.6" clipPath="url(#mountainMasterClip)" />
          <path d="M440,150 L460,150 L478,135 L482,142 L468,156 L444,158 Z" fill="#0d0a06" opacity="0.28" clipPath="url(#mountainMasterClip)" />

          {/* Outcrop 4 — near summit */}
          <path d="M600,82 L622,72 L632,76 L618,90 Z" fill="#3d2e1a" opacity="0.55" clipPath="url(#mountainMasterClip)" />
          <path d="M600,90 L618,90 L632,76 L636,82 L624,94 L604,96 Z" fill="#0d0a06" opacity="0.25" clipPath="url(#mountainMasterClip)" />

          {/* ═══ DARK CREVASSE LINES (deep shadow depth) ═══ */}
          {/* Vertical/diagonal crevasses running down the face */}
          <path d="M160,230 Q165,245 162,265 Q158,280 155,295" fill="none" stroke="#080604" strokeWidth="1.8" opacity="0.35" clipPath="url(#mountainMasterClip)" />
          <path d="M240,200 Q248,218 245,238 Q240,255 238,270" fill="none" stroke="#080604" strokeWidth="1.5" opacity="0.3" clipPath="url(#mountainMasterClip)" />
          <path d="M330,168 Q338,185 335,202 Q330,218 328,232" fill="none" stroke="#080604" strokeWidth="1.4" opacity="0.28" clipPath="url(#mountainMasterClip)" />
          <path d="M460,135 Q468,150 465,168 Q460,182 458,195" fill="none" stroke="#080604" strokeWidth="1.2" opacity="0.25" clipPath="url(#mountainMasterClip)" />
          <path d="M560,90 Q566,104 563,118 Q558,130 556,142" fill="none" stroke="#080604" strokeWidth="1" opacity="0.22" clipPath="url(#mountainMasterClip)" />
          <path d="M660,55 Q666,68 663,80 Q658,90 656,100" fill="none" stroke="#080604" strokeWidth="0.9" opacity="0.2" clipPath="url(#mountainMasterClip)" />
          <path d="M720,38 Q726,48 724,60 Q720,70 718,78" fill="none" stroke="#080604" strokeWidth="0.7" opacity="0.18" clipPath="url(#mountainMasterClip)" />

          {/* Branching crevasse network */}
          <path d="M165,250 Q178,255 190,248" fill="none" stroke="#080604" strokeWidth="0.8" opacity="0.2" clipPath="url(#mountainMasterClip)" />
          <path d="M248,225 Q260,228 270,222" fill="none" stroke="#080604" strokeWidth="0.7" opacity="0.18" clipPath="url(#mountainMasterClip)" />
          <path d="M338,190 Q350,194 360,188" fill="none" stroke="#080604" strokeWidth="0.6" opacity="0.16" clipPath="url(#mountainMasterClip)" />
          <path d="M466,155 Q476,158 485,152" fill="none" stroke="#080604" strokeWidth="0.5" opacity="0.15" clipPath="url(#mountainMasterClip)" />

          {/* ═══ SCATTERED BOULDERS & ROCKS (more prominent) ═══ */}
          {/* Large boulders */}
          <ellipse cx="95" cy="260" rx="8" ry="4" fill="#2a2018" opacity="0.6" clipPath="url(#mountainMasterClip)" />
          <ellipse cx="95" cy="261" rx="8" ry="2" fill="#0d0a06" opacity="0.3" clipPath="url(#mountainMasterClip)" />

          <ellipse cx="210" cy="218" rx="7" ry="3.5" fill="#2a2018" opacity="0.55" clipPath="url(#mountainMasterClip)" />
          <ellipse cx="210" cy="219" rx="7" ry="2" fill="#0d0a06" opacity="0.25" clipPath="url(#mountainMasterClip)" />

          <ellipse cx="365" cy="162" rx="6" ry="3" fill="#2a2018" opacity="0.5" clipPath="url(#mountainMasterClip)" />
          <ellipse cx="365" cy="163" rx="6" ry="1.5" fill="#0d0a06" opacity="0.22" clipPath="url(#mountainMasterClip)" />

          <ellipse cx="505" cy="108" rx="5" ry="2.5" fill="#2a2018" opacity="0.45" clipPath="url(#mountainMasterClip)" />
          <ellipse cx="505" cy="109" rx="5" ry="1.5" fill="#0d0a06" opacity="0.2" clipPath="url(#mountainMasterClip)" />

          <ellipse cx="655" cy="55" rx="4" ry="2" fill="#2a2018" opacity="0.4" clipPath="url(#mountainMasterClip)" />

          {/* Smaller scattered rocks */}
          <circle cx="70" cy="275" r="3" fill="#3d3025" opacity="0.5" clipPath="url(#mountainMasterClip)" />
          <circle cx="145" cy="243" r="2.5" fill="#3d3025" opacity="0.45" clipPath="url(#mountainMasterClip)" />
          <circle cx="195" cy="228" r="2" fill="#3d3025" opacity="0.4" clipPath="url(#mountainMasterClip)" />
          <circle cx="310" cy="180" r="2.5" fill="#3d3025" opacity="0.4" clipPath="url(#mountainMasterClip)" />
          <circle cx="420" cy="140" r="2" fill="#3d3025" opacity="0.38" clipPath="url(#mountainMasterClip)" />
          <circle cx="540" cy="95" r="2" fill="#4a3828" opacity="0.4" clipPath="url(#mountainMasterClip)" />
          <circle cx="610" cy="68" r="1.8" fill="#4a3828" opacity="0.35" clipPath="url(#mountainMasterClip)" />
          <circle cx="690" cy="42" r="1.5" fill="#4a3828" opacity="0.3" clipPath="url(#mountainMasterClip)" />

          {/* ═══ SNOW — FULL MOUNTAIN COVERAGE with gradual thinning ═══ */}

          {/* --- ZONE 1: SUMMIT / PEAK — heavy, bright white snow --- */}
          {/* Thick snow cap at the very peak */}
          <path
            d="M700,36 L720,30 L750,25 L780,28 L800,32 L800,38 L785,34 L760,30 L740,28 L720,32 L705,38 Z"
            fill="#ffffff" opacity="0.9"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Broader snow field below peak */}
          <path
            d="M670,48 L690,40 L720,30 L750,25 L780,28 L800,32 L800,55 L790,45 L770,38 L748,33 L730,32 L710,36 L692,42 L678,50 Z"
            fill="#ffffff" opacity="0.7"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Snow drifts hanging off peak — windblown */}
          <path
            d="M750,25 C745,28 738,26 732,30 C728,32 725,30 720,33"
            fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.6"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M780,28 C775,32 768,30 762,34 C758,36 752,34 748,37"
            fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Irregular snow patches at peak */}
          <path d="M735,30 L748,27 L758,30 L750,35 L738,34 Z" fill="#ffffff" opacity="0.8" clipPath="url(#mountainMasterClip)" />
          <path d="M770,30 L782,28 L792,32 L784,36 L772,34 Z" fill="#ffffff" opacity="0.75" clipPath="url(#mountainMasterClip)" />

          {/* --- ZONE 2: UPPER MOUNTAIN — heavy snow with some rock showing --- */}
          {/* Large snow field on upper face */}
          <path
            d="M600,75 L625,65 L650,52 L680,44 L700,38 L690,50 L670,58 L650,64 L630,70 L612,78 Z"
            fill="url(#snowHeavy)" opacity="0.65"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Snow patches — front face upper area */}
          <path d="M640,55 L665,46 L678,50 L660,60 L644,62 Z" fill="#ffffff" opacity="0.55" clipPath="url(#mountainMasterClip)" />
          <path d="M680,42 L700,35 L712,38 L698,46 L684,48 Z" fill="#ffffff" opacity="0.6" clipPath="url(#mountainMasterClip)" />
          <path d="M615,72 L638,62 L648,66 L632,76 L618,78 Z" fill="#ffffff" opacity="0.45" clipPath="url(#mountainMasterClip)" />
          {/* Wind-blown snow streaks */}
          <path d="M700,40 C688,46 676,43 665,50" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.35" clipPath="url(#mountainMasterClip)" />
          <path d="M670,50 C660,55 648,52 638,58" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" clipPath="url(#mountainMasterClip)" />
          {/* Snow in crevasses (darker, blueish shadow snow) */}
          <path d="M660,58 Q665,68 663,78" fill="none" stroke="#b8c8d8" strokeWidth="2" opacity="0.2" clipPath="url(#mountainMasterClip)" />
          <path d="M720,40 Q725,50 723,60" fill="none" stroke="#b8c8d8" strokeWidth="1.8" opacity="0.18" clipPath="url(#mountainMasterClip)" />
          {/* Snow below ridge on the slope (wide drift) */}
          <path
            d="M650,52 L670,48 L698,42 L720,36 L750,30 L765,32 L778,34 L800,38 L800,70 L780,55 L755,45 L730,42 L710,46 L690,52 L670,58 L655,64 Z"
            fill="#dde6ef" opacity="0.3"
            clipPath="url(#mountainMasterClip)"
          />

          {/* --- ZONE 3: MID-UPPER — moderate snow patches with rock exposed --- */}
          {/* Broad snow patches on the mid-upper face */}
          <path
            d="M520,105 L548,94 L572,82 L595,74 L605,78 L585,88 L562,98 L540,108 L525,112 Z"
            fill="url(#snowMid)" opacity="0.5"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M555,88 L578,78 L592,82 L575,94 L558,98 Z"
            fill="#ffffff" opacity="0.35"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M580,78 L600,70 L612,74 L598,84 L584,88 Z"
            fill="#ffffff" opacity="0.3"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Isolated snow drifts */}
          <path d="M530,100 L550,92 L558,96 L542,105 Z" fill="#ffffff" opacity="0.28" clipPath="url(#mountainMasterClip)" />
          <path d="M568,86 L585,80 L594,84 L578,92 Z" fill="#e8eef5" opacity="0.3" clipPath="url(#mountainMasterClip)" />
          {/* Wind streaks */}
          <path d="M600,76 C590,82 578,78 568,84" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.22" clipPath="url(#mountainMasterClip)" />
          <path d="M565,86 C555,92 542,88 532,95" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.18" clipPath="url(#mountainMasterClip)" />
          {/* Shadow snow in couloirs */}
          <path d="M560,94 Q565,108 562,120" fill="none" stroke="#a0b0c0" strokeWidth="1.5" opacity="0.15" clipPath="url(#mountainMasterClip)" />
          <path d="M590,82 Q595,95 592,108" fill="none" stroke="#a0b0c0" strokeWidth="1.2" opacity="0.12" clipPath="url(#mountainMasterClip)" />

          {/* --- ZONE 4: MID — patchy snow, more rock visible --- */}
          {/* Scattered snow patches on middle face */}
          <path
            d="M400,140 L425,128 L445,134 L428,148 L408,150 Z"
            fill="url(#snowLight)" opacity="0.45"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M440,130 L462,120 L476,126 L460,138 L444,140 Z"
            fill="url(#snowLight)" opacity="0.4"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M470,120 L490,110 L502,115 L488,126 L474,128 Z"
            fill="url(#snowLight)" opacity="0.35"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Thin snow streaks */}
          <path d="M430,136 C418,142 406,138 395,145" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.15" clipPath="url(#mountainMasterClip)" />
          <path d="M480,118 C468,124 456,120 445,128" fill="none" stroke="#ffffff" strokeWidth="0.7" opacity="0.12" clipPath="url(#mountainMasterClip)" />
          {/* Small frost patches */}
          <path d="M415,138 L428,132 L434,136 L422,142 Z" fill="#ffffff" opacity="0.2" clipPath="url(#mountainMasterClip)" />
          <path d="M455,125 L468,118 L474,122 L462,130 Z" fill="#ffffff" opacity="0.18" clipPath="url(#mountainMasterClip)" />

          {/* --- ZONE 5: LOWER-MID — sparse snow, mostly frost patches --- */}
          <path
            d="M300,178 L322,168 L334,174 L318,186 L304,188 Z"
            fill="url(#snowLight)" opacity="0.3"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M340,165 L358,156 L368,162 L354,172 L344,174 Z"
            fill="url(#snowLight)" opacity="0.25"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M370,155 L388,146 L396,150 L382,160 L374,162 Z"
            fill="url(#snowLight)" opacity="0.2"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Thin frost streaks */}
          <path d="M320,172 C310,178 298,174 288,182" fill="none" stroke="#ffffff" strokeWidth="0.6" opacity="0.1" clipPath="url(#mountainMasterClip)" />
          <path d="M360,158 C350,164 338,160 328,168" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.08" clipPath="url(#mountainMasterClip)" />
          {/* Tiny snow in shadow pockets */}
          <path d="M310,175 L320,170 L324,173 L315,178 Z" fill="#d0dae5" opacity="0.15" clipPath="url(#mountainMasterClip)" />
          <path d="M350,162 L358,158 L362,160 L355,165 Z" fill="#d0dae5" opacity="0.12" clipPath="url(#mountainMasterClip)" />

          {/* --- ZONE 6: LOWER — very sparse, just hints of frost/snow in shadows --- */}
          <path d="M180,228 L196,220 L204,225 L192,234 Z" fill="#d0dae5" opacity="0.12" clipPath="url(#mountainMasterClip)" />
          <path d="M220,215 L234,208 L240,212 L228,220 Z" fill="#d0dae5" opacity="0.1" clipPath="url(#mountainMasterClip)" />
          <path d="M260,198 L272,192 L278,196 L268,204 Z" fill="#d0dae5" opacity="0.08" clipPath="url(#mountainMasterClip)" />
          {/* Frost in lower crevasses */}
          <path d="M170,240 Q174,250 172,260" fill="none" stroke="#c0ccd8" strokeWidth="0.8" opacity="0.08" clipPath="url(#mountainMasterClip)" />
          <path d="M245,215 Q248,224 246,232" fill="none" stroke="#c0ccd8" strokeWidth="0.6" opacity="0.06" clipPath="url(#mountainMasterClip)" />

          {/* --- ZONE 7: BASE — barely any snow, just a few frost marks --- */}
          <path d="M100,258 L112,252 L116,256 L106,262 Z" fill="#c0ccd8" opacity="0.06" clipPath="url(#mountainMasterClip)" />
          <path d="M140,244 L150,240 L154,243 L145,248 Z" fill="#c0ccd8" opacity="0.05" clipPath="url(#mountainMasterClip)" />

          {/* ═══ GLOWING SNOW HIGHLIGHTS (catching sunlight from upper-right) ═══ */}
          {/* These are soft bright spots where sunlight hits the snow directly */}
          <circle cx="745" cy="28" r="8" fill="#ffffff" opacity="0.15" filter="url(#snowGlow)" clipPath="url(#mountainMasterClip)" />
          <circle cx="710" cy="35" r="6" fill="#ffffff" opacity="0.1" filter="url(#snowGlow)" clipPath="url(#mountainMasterClip)" />
          <circle cx="680" cy="48" r="5" fill="#ffffff" opacity="0.08" filter="url(#snowGlow)" clipPath="url(#mountainMasterClip)" />
          <circle cx="590" cy="78" r="4" fill="#ffffff" opacity="0.06" filter="url(#snowGlow)" clipPath="url(#mountainMasterClip)" />

          {/* ═══ BASE CAMP — positioned ~15-20% up the mountain on the slope ═══ */}
          {/* Base camp sits at roughly x=155, y=238 (around the 50K-100K area on the slope) */}
          <g clipPath="url(#mountainMasterClip)">
            {/* Flat platform / cleared area */}
            <ellipse cx="165" cy="240" rx="38" ry="6" fill="#1a150e" opacity="0.6" />
            <ellipse cx="165" cy="238" rx="34" ry="4" fill="#2a2018" opacity="0.5" />

            {/* Tent 1 — main orange/amber tent (largest) */}
            <polygon points="140,236 158,212 176,236" fill="#5a3010" stroke="#E67E22" strokeWidth="1.5" opacity="0.9" />
            {/* Tent 1 front flap detail */}
            <line x1="158" y1="212" x2="158" y2="236" stroke="#E67E22" strokeWidth="0.8" opacity="0.5" />
            <line x1="149" y1="224" x2="167" y2="224" stroke="#E67E22" strokeWidth="0.5" opacity="0.3" />
            {/* Tent 1 shadow */}
            <ellipse cx="158" cy="237" rx="18" ry="3" fill="#000000" opacity="0.25" />

            {/* Tent 2 — second amber tent */}
            <polygon points="178,236 192,216 206,236" fill="#4a2808" stroke="#D4740E" strokeWidth="1.2" opacity="0.85" />
            <line x1="192" y1="216" x2="192" y2="236" stroke="#D4740E" strokeWidth="0.6" opacity="0.4" />
            {/* Tent 2 shadow */}
            <ellipse cx="192" cy="237" rx="14" ry="2.5" fill="#000000" opacity="0.2" />

            {/* Tent 3 — small supply tent */}
            <polygon points="125,236 134,222 143,236" fill="#3d2510" stroke="#C06A0A" strokeWidth="1" opacity="0.8" />
            <line x1="134" y1="222" x2="134" y2="236" stroke="#C06A0A" strokeWidth="0.5" opacity="0.3" />

            {/* Flag pole on main tent */}
            <line x1="158" y1="212" x2="158" y2="198" stroke="#8b8b9e" strokeWidth="1.2" />
            <path d="M158,198 L172,201 L158,204 Z" fill="var(--color-accent)" opacity="0.95" />

            {/* Supply boxes */}
            <rect x="208" y="232" width="8" height="6" rx="1" fill="#3a2a18" stroke="#5a4530" strokeWidth="0.5" opacity="0.7" />
            <rect x="218" y="233" width="6" height="5" rx="1" fill="#332418" stroke="#5a4530" strokeWidth="0.5" opacity="0.6" />

            {/* Campfire glow */}
            <circle cx="196" cy="234" r="4" fill="#E67E22" opacity="0.15" />
            <circle cx="196" cy="234" r="2.5" fill="#F0A050" opacity="0.25" />
            <circle cx="196" cy="234" r="1.2" fill="#FFD080" opacity="0.4" />
          </g>

          {/* Base camp label */}
          <text
            x="165"
            y="256"
            textAnchor="middle"
            fill="#D4A574"
            fontSize="9"
            fontWeight="700"
            fontFamily="Inter, sans-serif"
            opacity="0.8"
            letterSpacing="1.5"
          >
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
