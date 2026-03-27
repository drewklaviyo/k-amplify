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

            {/* CLIFF FACE — dark cool blue-grey shadow side */}
            <linearGradient id="cliffFaceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2030" />
              <stop offset="30%" stopColor="#151c28" />
              <stop offset="60%" stopColor="#101822" />
              <stop offset="100%" stopColor="#0a1018" />
            </linearGradient>

            {/* LIT SLOPE — warm sunlit face */}
            <linearGradient id="litSlopeGrad" x1="0.8" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7a6040" />
              <stop offset="20%" stopColor="#5a4530" />
              <stop offset="50%" stopColor="#4a3828" />
              <stop offset="75%" stopColor="#3a2a18" />
              <stop offset="100%" stopColor="#2a1f10" />
            </linearGradient>

            {/* Progress fill */}
            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-accent-light)" stopOpacity="0.5" />
            </linearGradient>

            {/* Snow gradient — bright white for lit face */}
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

            {/* Shadow snow for cliff face — blue-grey tint */}
            <linearGradient id="cliffSnowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8898b0" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#5a6a80" stopOpacity="0.2" />
            </linearGradient>

            {/* Clip path for entire mountain shape */}
            <clipPath id="mountainMasterClip">
              <path d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z" />
            </clipPath>

            {/* Clip path for cliff face only (below the dividing line) */}
            <clipPath id="cliffClip">
              <path d="M0,310 L0,300 L40,285 L100,262 L180,240 L260,215 L340,192 L420,170 L500,148 L580,128 L650,110 L720,95 L780,92 L800,98 L800,320 L0,320 Z" />
            </clipPath>

            {/* Clip path for lit slope only (above the dividing line) */}
            <clipPath id="litSlopeClip">
              <path d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,98 L780,92 L720,95 L650,110 L580,128 L500,148 L420,170 L340,192 L260,215 L180,240 L100,262 L40,285 L0,300 Z" />
            </clipPath>

            {/* Rock texture pattern */}
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

            {/* Filter for ridge glow */}
            <filter id="ridgeGlow" x="-5%" y="-50%" width="110%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
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
          <path
            d="M0,310 L80,260 L140,270 L220,210 L300,225 L380,175 L440,185 L520,140 L580,155 L640,115 L690,100 L740,92 L780,85 L800,90 L800,320 L0,320 Z"
            fill="#12101a"
            opacity="0.45"
          />

          {/* ═══ MAIN MOUNTAIN BODY — full shape fill (base layer) ═══ */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z"
            fill="#1a1510"
          />

          {/* ═══ CLIFF FACE — dark cool blue-grey front wall (the 3D depth maker) ═══ */}
          {/* This steep face drops from the dividing line to the base, much darker & cooler */}
          <path
            d="M0,310 L0,300 L40,285 L100,262 L180,240 L260,215 L340,192 L420,170 L500,148 L580,128 L650,110 L720,95 L780,92 L800,98 L800,320 L0,320 Z"
            fill="url(#cliffFaceGrad)"
          />

          {/* Cliff face vertical striations — dark near-vertical cracks */}
          <path d="M50,296 L55,290 L58,310 L52,315 Z" fill="#080c14" opacity="0.5" clipPath="url(#cliffClip)" />
          <path d="M130,268 L136,260 L140,290 L134,296 Z" fill="#080c14" opacity="0.45" clipPath="url(#cliffClip)" />
          <path d="M220,240 L228,232 L232,268 L224,274 Z" fill="#080c14" opacity="0.4" clipPath="url(#cliffClip)" />
          <path d="M320,210 L328,202 L332,242 L324,248 Z" fill="#080c14" opacity="0.38" clipPath="url(#cliffClip)" />
          <path d="M430,182 L438,174 L442,215 L434,220 Z" fill="#080c14" opacity="0.35" clipPath="url(#cliffClip)" />
          <path d="M540,152 L548,144 L552,185 L544,190 Z" fill="#080c14" opacity="0.32" clipPath="url(#cliffClip)" />
          <path d="M640,125 L648,118 L652,155 L644,160 Z" fill="#080c14" opacity="0.28" clipPath="url(#cliffClip)" />
          <path d="M730,102 L738,96 L742,130 L734,135 Z" fill="#080c14" opacity="0.25" clipPath="url(#cliffClip)" />

          {/* Cliff face horizontal ledges (subtle) */}
          <path d="M0,308 L100,278 L200,252 L300,230 L400,208 L500,185 L600,162 L700,140 L800,128" fill="none" stroke="#2a3548" strokeWidth="0.8" opacity="0.3" clipPath="url(#cliffClip)" />
          <path d="M0,316 L100,292 L200,270 L300,252 L400,235 L500,218 L600,200 L700,182 L800,170" fill="none" stroke="#2a3548" strokeWidth="0.6" opacity="0.2" clipPath="url(#cliffClip)" />

          {/* ═══ CLIFF FACE SNOW — blue-grey shadow snow (large irregular patches) ═══ */}

          {/* Cliff snow — summit area */}
          <path
            d="M700,100 L730,98 L760,100 L790,105 L800,110 L800,135 L780,125 L750,118 L720,115 L700,120 L690,112 Z"
            fill="#7888a0" opacity="0.4" clipPath="url(#cliffClip)"
          />
          <path
            d="M740,96 L770,98 L795,105 L800,115 L800,128 L785,118 L760,112 L738,110 L730,104 Z"
            fill="#8898b0" opacity="0.35" clipPath="url(#cliffClip)"
          />

          {/* Cliff snow — upper area */}
          <path
            d="M580,135 L620,128 L660,122 L690,118 L700,125 L690,138 L660,142 L625,148 L590,152 L575,145 Z"
            fill="#687890" opacity="0.3" clipPath="url(#cliffClip)"
          />
          <path
            d="M620,130 L655,125 L685,120 L695,128 L685,140 L655,145 L628,148 L615,140 Z"
            fill="#8090a8" opacity="0.25" clipPath="url(#cliffClip)"
          />

          {/* Cliff snow — mid area */}
          <path
            d="M430,178 L475,170 L520,162 L555,158 L565,168 L548,180 L510,184 L470,192 L440,196 L425,188 Z"
            fill="#5a6a82" opacity="0.22" clipPath="url(#cliffClip)"
          />
          <path
            d="M480,172 L520,165 L550,160 L558,170 L545,180 L515,184 L485,190 L472,182 Z"
            fill="#708098" opacity="0.18" clipPath="url(#cliffClip)"
          />

          {/* Cliff snow — lower-mid */}
          <path
            d="M280,228 L330,218 L380,208 L410,204 L418,215 L398,225 L355,232 L310,240 L285,242 L275,235 Z"
            fill="#4a5a72" opacity="0.16" clipPath="url(#cliffClip)"
          />

          {/* Cliff snow — base frost */}
          <path
            d="M100,275 L160,262 L220,248 L260,240 L268,250 L240,260 L180,275 L120,290 L95,288 Z"
            fill="#3a4a62" opacity="0.1" clipPath="url(#cliffClip)"
          />

          {/* ═══ LIT SLOPE — warm sunlit upper face ═══ */}
          {/* This is the top portion of the mountain above the dividing line */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,98 L780,92 L720,95 L650,110 L580,128 L500,148 L420,170 L340,192 L260,215 L180,240 L100,262 L40,285 L0,300 Z"
            fill="url(#litSlopeGrad)"
          />

          {/* Rock texture overlay on the lit slope */}
          <rect x="0" y="0" width="800" height="320" fill="url(#rockTexture)" clipPath="url(#litSlopeClip)" />
          <rect x="0" y="0" width="800" height="320" fill="url(#screeTexture)" clipPath="url(#litSlopeClip)" />

          {/* ═══ RIDGE LINE HIGHLIGHT — bright glowing edge where two faces meet ═══ */}
          {/* Outer glow (wide, soft) */}
          <path
            d="M0,300 L40,285 L100,262 L180,240 L260,215 L340,192 L420,170 L500,148 L580,128 L650,110 L720,95 L780,92 L800,98"
            fill="none"
            stroke="#c8a878"
            strokeWidth="4"
            opacity="0.25"
            filter="url(#ridgeGlow)"
          />
          {/* Core ridge highlight (bright, sharp) */}
          <path
            d="M0,300 L40,285 L100,262 L180,240 L260,215 L340,192 L420,170 L500,148 L580,128 L650,110 L720,95 L780,92 L800,98"
            fill="none"
            stroke="#d4b888"
            strokeWidth="2"
            opacity="0.6"
          />
          {/* Brightest inner edge */}
          <path
            d="M0,300 L40,285 L100,262 L180,240 L260,215 L340,192 L420,170 L500,148 L580,128 L650,110 L720,95 L780,92 L800,98"
            fill="none"
            stroke="#e8d0a0"
            strokeWidth="0.8"
            opacity="0.8"
          />

          {/* ═══ TOP RIDGE highlight (summit edge catches most light) ═══ */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32"
            fill="none"
            stroke="#a08060"
            strokeWidth="1.5"
            opacity="0.5"
          />
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32"
            fill="none"
            stroke="#c8a878"
            strokeWidth="0.6"
            opacity="0.4"
          />

          {/* ═══ ROCK RIDGES on lit slope ═══ */}
          <path
            d="M60,292 L100,268 L160,248 L200,234 L220,228"
            fill="none" stroke="#6a5238" strokeWidth="2" opacity="0.35"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M60,294 L100,270 L160,250 L200,236 L220,230"
            fill="none" stroke="#1a1208" strokeWidth="1" opacity="0.25"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M180,252 L240,232 L310,208 L370,190 L420,175"
            fill="none" stroke="#6a5238" strokeWidth="1.8" opacity="0.3"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M350,198 L420,172 L490,148 L550,130 L600,115"
            fill="none" stroke="#6a5238" strokeWidth="1.5" opacity="0.25"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M520,152 L580,132 L640,112 L690,100 L730,96"
            fill="none" stroke="#6a5238" strokeWidth="1.2" opacity="0.2"
            clipPath="url(#litSlopeClip)"
          />

          {/* ═══ ROCK OUTCROPS on lit slope ═══ */}
          <path d="M120,258 L145,248 L155,252 L140,264 Z" fill="#4a3820" opacity="0.6" clipPath="url(#litSlopeClip)" />
          <path d="M120,264 L140,264 L155,252 L158,258 L145,270 L122,272 Z" fill="#1a1208" opacity="0.3" clipPath="url(#litSlopeClip)" />

          <path d="M280,218 L310,208 L322,212 L305,224 Z" fill="#4a3820" opacity="0.55" clipPath="url(#litSlopeClip)" />
          <path d="M280,224 L305,224 L322,212 L326,218 L312,230 L284,232 Z" fill="#1a1208" opacity="0.25" clipPath="url(#litSlopeClip)" />

          <path d="M440,158 L465,148 L478,152 L460,164 Z" fill="#4a3820" opacity="0.5" clipPath="url(#litSlopeClip)" />
          <path d="M440,164 L460,164 L478,152 L482,158 L468,170 L444,172 Z" fill="#1a1208" opacity="0.22" clipPath="url(#litSlopeClip)" />

          <path d="M600,108 L622,100 L632,104 L618,114 Z" fill="#4a3820" opacity="0.45" clipPath="url(#litSlopeClip)" />
          <path d="M600,114 L618,114 L632,104 L636,110 L624,120 L604,122 Z" fill="#1a1208" opacity="0.2" clipPath="url(#litSlopeClip)" />

          {/* ═══ CREVASSE LINES on lit slope ═══ */}
          <path d="M160,240 Q165,252 162,265" fill="none" stroke="#1a1208" strokeWidth="1.5" opacity="0.3" clipPath="url(#litSlopeClip)" />
          <path d="M240,218 Q248,232 245,248" fill="none" stroke="#1a1208" strokeWidth="1.3" opacity="0.25" clipPath="url(#litSlopeClip)" />
          <path d="M330,192 Q338,205 335,218" fill="none" stroke="#1a1208" strokeWidth="1.2" opacity="0.22" clipPath="url(#litSlopeClip)" />
          <path d="M460,155 Q468,168 465,180" fill="none" stroke="#1a1208" strokeWidth="1" opacity="0.2" clipPath="url(#litSlopeClip)" />
          <path d="M560,118 Q566,130 563,142" fill="none" stroke="#1a1208" strokeWidth="0.8" opacity="0.18" clipPath="url(#litSlopeClip)" />
          <path d="M660,80 Q666,92 663,104" fill="none" stroke="#1a1208" strokeWidth="0.7" opacity="0.15" clipPath="url(#litSlopeClip)" />

          {/* ═══ BOULDERS on lit slope ═══ */}
          <ellipse cx="95" cy="262" rx="7" ry="3.5" fill="#3a2a18" opacity="0.5" clipPath="url(#litSlopeClip)" />
          <ellipse cx="210" cy="230" rx="6" ry="3" fill="#3a2a18" opacity="0.45" clipPath="url(#litSlopeClip)" />
          <ellipse cx="365" cy="185" rx="5" ry="2.5" fill="#3a2a18" opacity="0.4" clipPath="url(#litSlopeClip)" />
          <ellipse cx="505" cy="140" rx="4.5" ry="2.2" fill="#3a2a18" opacity="0.35" clipPath="url(#litSlopeClip)" />
          <ellipse cx="655" cy="100" rx="4" ry="2" fill="#3a2a18" opacity="0.3" clipPath="url(#litSlopeClip)" />

          <circle cx="70" cy="275" r="3" fill="#4a3828" opacity="0.4" clipPath="url(#litSlopeClip)" />
          <circle cx="145" cy="252" r="2.5" fill="#4a3828" opacity="0.35" clipPath="url(#litSlopeClip)" />
          <circle cx="310" cy="202" r="2.5" fill="#4a3828" opacity="0.32" clipPath="url(#litSlopeClip)" />
          <circle cx="420" cy="165" r="2" fill="#4a3828" opacity="0.3" clipPath="url(#litSlopeClip)" />
          <circle cx="540" cy="128" r="2" fill="#4a3828" opacity="0.28" clipPath="url(#litSlopeClip)" />
          <circle cx="690" cy="96" r="1.5" fill="#4a3828" opacity="0.25" clipPath="url(#litSlopeClip)" />

          {/* ═══ LIT SLOPE SNOW — bright white on the sunlit face ═══ */}

          {/* --- ZONE 1: SUMMIT — heavy bright white snow --- */}
          <path
            d="M700,36 L720,30 L750,25 L780,28 L800,32 L800,38 L785,34 L760,30 L740,28 L720,32 L705,38 Z"
            fill="#ffffff" opacity="0.9"
            clipPath="url(#mountainMasterClip)"
          />
          <path
            d="M670,48 L690,40 L720,30 L750,25 L780,28 L800,32 L800,55 L790,45 L770,38 L748,33 L730,32 L710,36 L692,42 L678,50 Z"
            fill="#ffffff" opacity="0.7"
            clipPath="url(#litSlopeClip)"
          />
          {/* Peak snow patches */}
          <path d="M735,30 L748,27 L758,30 L750,35 L738,34 Z" fill="#ffffff" opacity="0.8" clipPath="url(#litSlopeClip)" />
          <path d="M770,30 L782,28 L792,32 L784,36 L772,34 Z" fill="#ffffff" opacity="0.75" clipPath="url(#litSlopeClip)" />

          {/* --- ZONE 2: UPPER — large irregular snow fields on lit face --- */}
          <path
            d="M600,75 L640,62 L680,50 L720,40 L750,32 L760,38 L740,48 L700,58 L660,70 L625,80 L600,88 L590,82 Z"
            fill="#ffffff" opacity="0.55"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M620,68 L660,56 L700,45 L730,38 L740,44 L710,55 L670,66 L635,78 L615,82 Z"
            fill="#ffffff" opacity="0.45"
            clipPath="url(#litSlopeClip)"
          />
          {/* Broad drift below summit on lit face */}
          <path
            d="M650,52 L698,42 L750,30 L778,34 L800,38 L800,70 L780,55 L745,48 L710,52 L670,62 L645,68 L635,60 Z"
            fill="#dde6ef" opacity="0.35"
            clipPath="url(#litSlopeClip)"
          />
          {/* Wind-blown streaks */}
          <path d="M700,42 C688,48 676,45 665,52" fill="none" stroke="#ffffff" strokeWidth="1.8" opacity="0.35" clipPath="url(#litSlopeClip)" />
          <path d="M670,52 C660,58 648,55 638,62" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" clipPath="url(#litSlopeClip)" />

          {/* --- ZONE 3: MID-UPPER — moderate snow with rock gaps --- */}
          <path
            d="M520,108 L560,96 L600,82 L630,74 L640,80 L615,92 L575,106 L540,118 L515,122 Z"
            fill="url(#snowMid)" opacity="0.5"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M555,96 L590,84 L618,78 L628,84 L600,96 L565,108 L548,106 Z"
            fill="#ffffff" opacity="0.32"
            clipPath="url(#litSlopeClip)"
          />
          <path d="M530,104 L558,94 L566,98 L542,110 Z" fill="#ffffff" opacity="0.28" clipPath="url(#litSlopeClip)" />
          <path d="M580,85 L600,78 L608,82 L590,92 Z" fill="#e8eef5" opacity="0.3" clipPath="url(#litSlopeClip)" />

          {/* --- ZONE 4: MID — patchy snow on lit face --- */}
          <path
            d="M400,150 L440,138 L480,128 L510,122 L518,130 L490,142 L450,154 L415,164 L398,160 Z"
            fill="url(#snowLight)" opacity="0.4"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M440,140 L475,130 L505,124 L512,132 L485,142 L452,152 L435,150 Z"
            fill="#ffffff" opacity="0.22"
            clipPath="url(#litSlopeClip)"
          />
          <path d="M415,148 L438,138 L446,142 L426,154 Z" fill="#ffffff" opacity="0.18" clipPath="url(#litSlopeClip)" />
          <path d="M465,132 L488,122 L496,126 L476,138 Z" fill="#ffffff" opacity="0.15" clipPath="url(#litSlopeClip)" />

          {/* --- ZONE 5: LOWER-MID — sparse frost --- */}
          <path
            d="M300,196 L340,184 L380,174 L400,170 L406,178 L385,188 L348,198 L312,208 L296,204 Z"
            fill="url(#snowLight)" opacity="0.25"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M340,186 L372,176 L395,172 L400,180 L378,190 L348,198 L334,196 Z"
            fill="#ffffff" opacity="0.1"
            clipPath="url(#litSlopeClip)"
          />

          {/* --- ZONE 6: LOWER — hints of frost --- */}
          <path d="M180,234 L210,224 L224,228 L200,240 L184,240 Z" fill="#d0dae5" opacity="0.1" clipPath="url(#litSlopeClip)" />
          <path d="M240,218 L268,208 L278,212 L256,224 L244,224 Z" fill="#d0dae5" opacity="0.08" clipPath="url(#litSlopeClip)" />

          {/* --- ZONE 7: BASE — barely visible frost --- */}
          <path d="M100,258 L124,250 L130,254 L110,264 Z" fill="#c0ccd8" opacity="0.06" clipPath="url(#litSlopeClip)" />
          <path d="M140,248 L160,240 L166,244 L148,254 Z" fill="#c0ccd8" opacity="0.05" clipPath="url(#litSlopeClip)" />

          {/* ═══ GLOWING SNOW HIGHLIGHTS on lit face ═══ */}
          <circle cx="745" cy="28" r="8" fill="#ffffff" opacity="0.15" filter="url(#snowGlow)" clipPath="url(#litSlopeClip)" />
          <circle cx="710" cy="35" r="6" fill="#ffffff" opacity="0.1" filter="url(#snowGlow)" clipPath="url(#litSlopeClip)" />
          <circle cx="680" cy="48" r="5" fill="#ffffff" opacity="0.08" filter="url(#snowGlow)" clipPath="url(#litSlopeClip)" />
          <circle cx="590" cy="82" r="4" fill="#ffffff" opacity="0.06" filter="url(#snowGlow)" clipPath="url(#litSlopeClip)" />

          {/* ═══ SNOW COULOIRS on lit face ═══ */}
          <path d="M700,38 Q705,55 702,75 Q698,92 695,108" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.12" clipPath="url(#litSlopeClip)" />
          <path d="M650,52 Q655,72 652,92 Q648,110 645,125" fill="none" stroke="#ffffff" strokeWidth="3.5" opacity="0.1" clipPath="url(#litSlopeClip)" />
          <path d="M580,75 Q585,95 582,115 Q578,132 575,148" fill="none" stroke="#dde6ef" strokeWidth="3" opacity="0.08" clipPath="url(#litSlopeClip)" />
          <path d="M500,102 Q505,122 502,142 Q498,158 495,172" fill="none" stroke="#d0dae5" strokeWidth="2.5" opacity="0.06" clipPath="url(#litSlopeClip)" />
          <path d="M410,135 Q415,155 412,175 Q408,192 405,205" fill="none" stroke="#c8d4e0" strokeWidth="2" opacity="0.05" clipPath="url(#litSlopeClip)" />

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
