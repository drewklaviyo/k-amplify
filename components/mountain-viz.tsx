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
            {/* ── SKY ── */}
            <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#080c18" />
              <stop offset="45%" stopColor="#0d1220" />
              <stop offset="80%" stopColor="#111828" />
              <stop offset="100%" stopColor="#0e1420" />
            </linearGradient>

            {/* Subtle sky vignette — top-right brightens slightly (sun source) */}
            <radialGradient id="skyLightGrad" cx="85%" cy="5%" r="50%">
              <stop offset="0%" stopColor="#1a2848" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#080c18" stopOpacity="0" />
            </radialGradient>

            {/* ── MOUNTAIN FACES ── */}
            {/* Cliff face: deep cool blue-grey, darkest at base */}
            <linearGradient id="cliffFaceGrad" x1="0.1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c2535" />
              <stop offset="25%" stopColor="#141e2e" />
              <stop offset="55%" stopColor="#0e1824" />
              <stop offset="85%" stopColor="#0a1018" />
              <stop offset="100%" stopColor="#060c14" />
            </linearGradient>

            {/* Lit slope: warm golden-brown, rich near summit, deeper at base */}
            <linearGradient id="litSlopeGrad" x1="0.9" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#8a6e44" />
              <stop offset="15%" stopColor="#7a5e38" />
              <stop offset="35%" stopColor="#624a2a" />
              <stop offset="60%" stopColor="#4e3820" />
              <stop offset="82%" stopColor="#3a2818" />
              <stop offset="100%" stopColor="#261a0e" />
            </linearGradient>

            {/* Secondary warm overlay — catches more golden light toward upper right */}
            <linearGradient id="goldenLightGrad" x1="1" y1="0" x2="0.3" y2="1">
              <stop offset="0%" stopColor="#c8a060" stopOpacity="0.22" />
              <stop offset="40%" stopColor="#a07840" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#7a5828" stopOpacity="0" />
            </linearGradient>

            {/* ── PROGRESS ── */}
            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--color-accent-light)" stopOpacity="0.42" />
            </linearGradient>

            {/* ── SNOW ── */}
            <linearGradient id="snowSummit" x1="0.8" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="50%" stopColor="#eef2f8" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#d8e2ee" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="snowUpper" x1="0.8" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ccd8e8" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="snowMid" x1="0.8" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#c4d0e0" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="snowLight" x1="0.8" y1="0" x2="0.1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#b8c8da" stopOpacity="0.04" />
            </linearGradient>
            {/* Shadow snow on cliff face — blue-grey, cold */}
            <linearGradient id="cliffSnowGrad" x1="0.2" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8898b0" stopOpacity="0.55" />
              <stop offset="60%" stopColor="#6878a0" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#4a5a80" stopOpacity="0.1" />
            </linearGradient>

            {/* ── ATMOSPHERIC HAZE ── */}
            <linearGradient id="hazeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1020" stopOpacity="0" />
              <stop offset="100%" stopColor="#0a1020" stopOpacity="0.55" />
            </linearGradient>

            {/* ── CLIP PATHS ── */}
            {/* Full mountain silhouette */}
            <clipPath id="mountainMasterClip">
              <path d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z" />
            </clipPath>
            {/* Cliff face only — the steep front wall below the ridge divider */}
            <clipPath id="cliffClip">
              <path d="M0,320 L0,300 L40,287 L100,265 L180,244 L260,218 L340,196 L420,174 L500,152 L580,132 L650,114 L720,99 L780,96 L800,100 L800,320 Z" />
            </clipPath>
            {/* Lit slope only — the angled upper face */}
            <clipPath id="litSlopeClip">
              <path d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,100 L780,96 L720,99 L650,114 L580,132 L500,152 L420,174 L340,196 L260,218 L180,244 L100,265 L40,287 L0,300 Z" />
            </clipPath>

            {/* ── TEXTURES ── */}
            {/* Fine rock grain — lit slope */}
            <pattern id="rockGrain" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="6" r="1.2" fill="#ffffff" opacity="0.05" />
              <circle cx="14" cy="3" r="0.8" fill="#ffffff" opacity="0.07" />
              <circle cx="9" cy="16" r="1.4" fill="#ffffff" opacity="0.04" />
              <circle cx="20" cy="12" r="0.6" fill="#ffffff" opacity="0.08" />
              <circle cx="7" cy="21" r="1" fill="#ffffff" opacity="0.04" />
              <circle cx="18" cy="20" r="1.1" fill="#ffffff" opacity="0.03" />
              <rect x="11" y="8" width="1.8" height="0.8" fill="#000000" opacity="0.05" rx="0.4" />
              <rect x="2" y="14" width="1.2" height="0.6" fill="#000000" opacity="0.04" rx="0.3" />
              <rect x="16" y="17" width="1.5" height="0.7" fill="#000000" opacity="0.05" rx="0.3" />
            </pattern>
            {/* Cliff strata — horizontal noise for rock layers */}
            <pattern id="cliffStrata" width="120" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="4" x2="120" y2="4" stroke="#2a3850" strokeWidth="0.6" opacity="0.4" />
              <line x1="0" y1="7.5" x2="120" y2="7.5" stroke="#1e2e42" strokeWidth="0.4" opacity="0.25" />
            </pattern>

            {/* ── FILTERS ── */}
            {/* Soft halo for snow brightness */}
            <filter id="snowGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Wide atmospheric ridge glow */}
            <filter id="ridgeGlowWide" x="-8%" y="-80%" width="116%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
            </filter>
            {/* Tight ridge glow */}
            <filter id="ridgeGlowTight" x="-4%" y="-60%" width="108%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" />
            </filter>
            {/* Star softening */}
            <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" />
            </filter>
            {/* Base mist blur */}
            <filter id="mistFilter" x="-5%" y="-20%" width="110%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
            </filter>
          </defs>

          {/* ═══════════════════════════════════════════════
               LAYER 1 — SKY
          ═══════════════════════════════════════════════ */}
          <rect x="0" y="0" width="800" height="320" fill="url(#skyGrad)" />
          {/* Golden-hour upper-right sky warmth */}
          <rect x="0" y="0" width="800" height="320" fill="url(#skyLightGrad)" />

          {/* Stars — sparse, mostly upper half */}
          {[
            [30,18],[72,8],[115,22],[158,6],[195,15],[240,4],[285,19],[330,9],[385,5],
            [428,14],[470,7],[510,20],[555,3],[595,12],[635,22],[670,8],[708,15],[745,4],
            [775,18],[55,35],[140,42],[230,28],[320,38],[415,30],[505,45],[600,33],[690,40],
            [760,27],[20,50],[100,58],[190,48],[275,55],[360,44],[450,52],[540,40],[630,50],
          ].map(([x, y], i) => (
            <circle
              key={`star-${i}`}
              cx={x} cy={y}
              r={i % 5 === 0 ? 1.2 : i % 3 === 0 ? 0.9 : 0.6}
              fill="#ffffff"
              opacity={0.3 + (i % 4) * 0.12}
              filter="url(#starGlow)"
            />
          ))}

          {/* ═══════════════════════════════════════════════
               LAYER 2 — BACKGROUND MOUNTAINS (3 layers)
               Each progressively lighter and smaller
          ═══════════════════════════════════════════════ */}

          {/* Far background range — nearly flat, very dark navy */}
          <path
            d="M0,295 L50,268 L90,278 L140,252 L200,265 L265,235 L320,248 L390,218 L450,230 L520,200 L575,212 L640,185 L695,172 L740,160 L775,155 L800,162 L800,320 L0,320 Z"
            fill="#0d0b1a"
            opacity="0.85"
          />
          {/* Mid background range — slightly lighter, bluer */}
          <path
            d="M0,305 L65,278 L105,290 L165,260 L225,275 L295,245 L350,258 L420,228 L475,242 L545,215 L600,228 L658,200 L705,188 L748,176 L780,172 L800,178 L800,320 L0,320 Z"
            fill="#100e1e"
            opacity="0.7"
          />
          {/* Near background range — warmest, most blue-grey */}
          <path
            d="M0,315 L75,292 L120,302 L185,275 L245,288 L310,262 L370,274 L435,248 L490,260 L555,236 L608,248 L665,222 L712,212 L755,200 L785,198 L800,204 L800,320 L0,320 Z"
            fill="#13111e"
            opacity="0.55"
          />

          {/* ═══════════════════════════════════════════════
               LAYER 3 — MAIN MOUNTAIN BASE FILL
          ═══════════════════════════════════════════════ */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,320 L0,320 Z"
            fill="#181210"
          />

          {/* ═══════════════════════════════════════════════
               LAYER 4 — CLIFF FACE (front shadow wall)
               The steeply angled face facing the viewer —
               this is the #1 source of 3D depth.
          ═══════════════════════════════════════════════ */}
          <path
            d="M0,320 L0,300 L40,287 L100,265 L180,244 L260,218 L340,196 L420,174 L500,152 L580,132 L650,114 L720,99 L780,96 L800,100 L800,320 Z"
            fill="url(#cliffFaceGrad)"
          />

          {/* Cliff strata — horizontal rock layers give geological realism */}
          <rect x="0" y="0" width="800" height="320" fill="url(#cliffStrata)" clipPath="url(#cliffClip)" opacity="0.9" />

          {/* Cliff vertical crack/striations — dark near-vertical fractures */}
          <path d="M45,300 L50,292 L54,318 L48,320 Z" fill="#05090f" opacity="0.6" clipPath="url(#cliffClip)" />
          <path d="M120,272 L126,263 L130,295 L124,300 Z" fill="#05090f" opacity="0.55" clipPath="url(#cliffClip)" />
          <path d="M205,248 L212,238 L217,274 L210,280 Z" fill="#05090f" opacity="0.5" clipPath="url(#cliffClip)" />
          <path d="M295,222 L303,212 L308,252 L300,258 Z" fill="#05090f" opacity="0.45" clipPath="url(#cliffClip)" />
          <path d="M390,198 L398,188 L403,228 L395,234 Z" fill="#05090f" opacity="0.4" clipPath="url(#cliffClip)" />
          <path d="M488,174 L496,165 L501,205 L493,210 Z" fill="#05090f" opacity="0.36" clipPath="url(#cliffClip)" />
          <path d="M582,150 L590,142 L595,180 L587,186 Z" fill="#05090f" opacity="0.32" clipPath="url(#cliffClip)" />
          <path d="M672,126 L680,118 L685,156 L677,162 Z" fill="#05090f" opacity="0.28" clipPath="url(#cliffClip)" />
          <path d="M752,106 L760,100 L764,134 L756,140 Z" fill="#05090f" opacity="0.24" clipPath="url(#cliffClip)" />

          {/* Cliff secondary cracks — thinner, between the main ones */}
          <path d="M82,285 L86,278 L88,308 L84,312 Z" fill="#060a10" opacity="0.35" clipPath="url(#cliffClip)" />
          <path d="M162,260 L167,252 L169,284 L165,288 Z" fill="#060a10" opacity="0.32" clipPath="url(#cliffClip)" />
          <path d="M250,235 L256,227 L258,260 L253,264 Z" fill="#060a10" opacity="0.28" clipPath="url(#cliffClip)" />
          <path d="M345,210 L351,202 L353,234 L348,238 Z" fill="#060a10" opacity="0.25" clipPath="url(#cliffClip)" />
          <path d="M440,186 L446,178 L448,210 L443,214 Z" fill="#060a10" opacity="0.22" clipPath="url(#cliffClip)" />
          <path d="M536,162 L542,154 L544,186 L539,190 Z" fill="#060a10" opacity="0.2" clipPath="url(#cliffClip)" />
          <path d="M628,138 L634,130 L636,162 L631,166 Z" fill="#060a10" opacity="0.18" clipPath="url(#cliffClip)" />
          <path d="M718,114 L724,108 L726,140 L721,144 Z" fill="#060a10" opacity="0.15" clipPath="url(#cliffClip)" />

          {/* Cliff ledge lines — horizontal strata catching slight light */}
          <path d="M0,312 L80,290 L160,270 L240,253 L320,238 L400,222 L480,206 L560,190 L640,175 L720,162 L800,152"
            fill="none" stroke="#2e3f58" strokeWidth="1.2" opacity="0.45" clipPath="url(#cliffClip)" />
          <path d="M0,318 L100,300 L200,282 L300,266 L400,250 L500,235 L600,220 L700,206 L800,196"
            fill="none" stroke="#263448" strokeWidth="0.8" opacity="0.3" clipPath="url(#cliffClip)" />
          <path d="M0,308 L60,292 L140,278 L220,264 L310,248 L400,234 L490,218 L580,203 L660,190 L740,178 L800,170"
            fill="none" stroke="#222e42" strokeWidth="0.5" opacity="0.2" clipPath="url(#cliffClip)" />

          {/* ═══════════════════════════════════════════════
               LAYER 5 — CLIFF FACE SNOW
               Blue-grey, cool — in shadow
          ═══════════════════════════════════════════════ */}

          {/* Summit cliff snow — heaviest accumulation near the peak */}
          <path
            d="M710,99 L732,97 L758,98 L782,100 L800,104 L800,132 L792,122 L774,114 L752,108 L730,110 L714,118 L706,110 Z"
            fill="url(#cliffSnowGrad)" clipPath="url(#cliffClip)"
          />
          <path
            d="M742,97 L765,98 L790,103 L800,108 L800,124 L788,115 L768,109 L748,106 L738,102 Z"
            fill="#9aaabf" opacity="0.38" clipPath="url(#cliffClip)"
          />
          {/* Irregular upper cliff snow pockets */}
          <path
            d="M598,132 L630,126 L662,120 L688,116 L696,124 L684,136 L656,142 L626,148 L604,152 L592,144 Z"
            fill="#7888a0" opacity="0.32" clipPath="url(#cliffClip)"
          />
          <path
            d="M635,124 L664,119 L688,116 L694,126 L682,138 L658,144 L638,148 L628,140 Z"
            fill="#8898b4" opacity="0.26" clipPath="url(#cliffClip)"
          />
          {/* Mid cliff snow — wide irregular patches */}
          <path
            d="M455,174 L490,167 L528,160 L558,155 L566,165 L548,178 L514,184 L478,192 L460,196 L448,188 Z"
            fill="#6070a0" opacity="0.24" clipPath="url(#cliffClip)"
          />
          <path
            d="M494,168 L526,162 L556,157 L562,167 L548,178 L518,184 L498,190 L486,182 Z"
            fill="#7888b0" opacity="0.19" clipPath="url(#cliffClip)"
          />
          {/* Lower-mid cliff snow — sparse */}
          <path
            d="M300,228 L338,220 L380,212 L408,208 L414,218 L396,228 L358,236 L318,244 L302,242 L292,235 Z"
            fill="#506090" opacity="0.16" clipPath="url(#cliffClip)"
          />
          {/* Base frost traces */}
          <path
            d="M115,278 L165,268 L220,256 L260,248 L266,258 L238,268 L185,282 L130,296 L108,292 Z"
            fill="#3c4e72" opacity="0.1" clipPath="url(#cliffClip)"
          />

          {/* ═══════════════════════════════════════════════
               LAYER 6 — LIT SLOPE (sunlit angled face)
               Warm golden-brown — this is the #2 3D cue
          ═══════════════════════════════════════════════ */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,100 L780,96 L720,99 L650,114 L580,132 L500,152 L420,174 L340,196 L260,218 L180,244 L100,265 L40,287 L0,300 Z"
            fill="url(#litSlopeGrad)"
          />

          {/* Golden hour warm overlay — upper right catches most sun */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32 L800,100 L780,96 L720,99 L650,114 L580,132 L500,152 L420,174 L340,196 L260,218 L180,244 L100,265 L40,287 L0,300 Z"
            fill="url(#goldenLightGrad)"
          />

          {/* Rock grain texture on lit face */}
          <rect x="0" y="0" width="800" height="320" fill="url(#rockGrain)" clipPath="url(#litSlopeClip)" opacity="0.85" />

          {/* Diagonal ridge lines on lit slope — secondary ridges catching/shedding light */}
          <path d="M55,295 L95,272 L150,255 L192,242 L215,236"
            fill="none" stroke="#7a5e38" strokeWidth="2.2" opacity="0.4" clipPath="url(#litSlopeClip)" />
          <path d="M57,297 L97,274 L152,257 L194,244 L217,238"
            fill="none" stroke="#160e06" strokeWidth="1.2" opacity="0.3" clipPath="url(#litSlopeClip)" />
          {/* Shadow-side of these ridges */}
          <path d="M52,296 L92,273 L148,256 L190,243 L213,237"
            fill="none" stroke="#c89848" strokeWidth="0.6" opacity="0.15" clipPath="url(#litSlopeClip)" />

          <path d="M175,256 L232,238 L298,214 L358,196 L405,182"
            fill="none" stroke="#7a5e38" strokeWidth="2" opacity="0.35" clipPath="url(#litSlopeClip)" />
          <path d="M177,258 L234,240 L300,216 L360,198 L407,184"
            fill="none" stroke="#160e06" strokeWidth="1" opacity="0.25" clipPath="url(#litSlopeClip)" />

          <path d="M345,202 L415,178 L484,154 L544,136 L592,122"
            fill="none" stroke="#7a5e38" strokeWidth="1.7" opacity="0.28" clipPath="url(#litSlopeClip)" />
          <path d="M347,204 L417,180 L486,156 L546,138 L594,124"
            fill="none" stroke="#160e06" strokeWidth="0.9" opacity="0.2" clipPath="url(#litSlopeClip)" />

          <path d="M510,156 L570,136 L632,116 L685,102 L725,94"
            fill="none" stroke="#7a5e38" strokeWidth="1.4" opacity="0.22" clipPath="url(#litSlopeClip)" />

          {/* ═══════════════════════════════════════════════
               LAYER 7 — ROCK OUTCROPS on lit slope
               Each outcrop = lit face + shadow underside
          ═══════════════════════════════════════════════ */}

          {/* Outcrop A — lower left */}
          <path d="M108,262 L136,252 L148,256 L132,270 Z" fill="#5a421e" opacity="0.7" clipPath="url(#litSlopeClip)" />
          <path d="M108,270 L132,270 L148,256 L152,263 L138,276 L112,278 Z" fill="#0e0a04" opacity="0.45" clipPath="url(#litSlopeClip)" />
          <path d="M108,262 L116,259 L125,262 L118,268 Z" fill="#8a6a38" opacity="0.35" clipPath="url(#litSlopeClip)" />

          {/* Outcrop B — lower mid */}
          <path d="M272,222 L302,212 L315,216 L298,228 Z" fill="#5a421e" opacity="0.65" clipPath="url(#litSlopeClip)" />
          <path d="M272,228 L298,228 L315,216 L320,222 L305,234 L276,236 Z" fill="#0e0a04" opacity="0.38" clipPath="url(#litSlopeClip)" />
          <path d="M272,222 L280,219 L290,222 L283,228 Z" fill="#8a6a38" opacity="0.3" clipPath="url(#litSlopeClip)" />

          {/* Outcrop C — mid slope */}
          <path d="M434,162 L460,152 L473,156 L455,168 Z" fill="#5a421e" opacity="0.58" clipPath="url(#litSlopeClip)" />
          <path d="M434,168 L455,168 L473,156 L477,162 L462,174 L438,176 Z" fill="#0e0a04" opacity="0.32" clipPath="url(#litSlopeClip)" />
          <path d="M434,162 L442,159 L451,162 L444,168 Z" fill="#8a6a38" opacity="0.26" clipPath="url(#litSlopeClip)" />

          {/* Outcrop D — upper slope */}
          <path d="M592,110 L616,102 L627,106 L612,116 Z" fill="#5a421e" opacity="0.5" clipPath="url(#litSlopeClip)" />
          <path d="M592,116 L612,116 L627,106 L631,112 L618,122 L596,124 Z" fill="#0e0a04" opacity="0.26" clipPath="url(#litSlopeClip)" />
          <path d="M592,110 L600,107 L608,110 L602,116 Z" fill="#8a6a38" opacity="0.22" clipPath="url(#litSlopeClip)" />

          {/* Outcrop E — near summit */}
          <path d="M696,56 L715,50 L724,53 L710,62 Z" fill="#5a421e" opacity="0.42" clipPath="url(#litSlopeClip)" />
          <path d="M696,62 L710,62 L724,53 L727,58 L716,66 L699,68 Z" fill="#0e0a04" opacity="0.22" clipPath="url(#litSlopeClip)" />

          {/* ═══════════════════════════════════════════════
               LAYER 8 — CREVASSES on lit slope
               Dark sinuous lines running down the face
          ═══════════════════════════════════════════════ */}
          <path d="M155,244 Q161,258 158,272" fill="none" stroke="#100808" strokeWidth="1.6" opacity="0.35" strokeLinecap="round" clipPath="url(#litSlopeClip)" />
          <path d="M233,222 Q240,237 237,252" fill="none" stroke="#100808" strokeWidth="1.4" opacity="0.3" strokeLinecap="round" clipPath="url(#litSlopeClip)" />
          <path d="M318,196 Q326,212 323,226" fill="none" stroke="#100808" strokeWidth="1.3" opacity="0.26" strokeLinecap="round" clipPath="url(#litSlopeClip)" />
          <path d="M408,168 Q416,182 413,196" fill="none" stroke="#100808" strokeWidth="1.1" opacity="0.22" strokeLinecap="round" clipPath="url(#litSlopeClip)" />
          <path d="M502,140 Q510,154 507,168" fill="none" stroke="#100808" strokeWidth="1" opacity="0.19" strokeLinecap="round" clipPath="url(#litSlopeClip)" />
          <path d="M596,108 Q603,121 600,134" fill="none" stroke="#100808" strokeWidth="0.85" opacity="0.16" strokeLinecap="round" clipPath="url(#litSlopeClip)" />
          <path d="M682,74 Q688,87 685,100" fill="none" stroke="#100808" strokeWidth="0.7" opacity="0.13" strokeLinecap="round" clipPath="url(#litSlopeClip)" />

          {/* ═══════════════════════════════════════════════
               LAYER 9 — BOULDERS on lit slope
          ═══════════════════════════════════════════════ */}
          <ellipse cx="88" cy="266" rx="8" ry="4" fill="#3a2810" opacity="0.6" clipPath="url(#litSlopeClip)" />
          <ellipse cx="88" cy="268" rx="8" ry="2" fill="#0c0804" opacity="0.4" clipPath="url(#litSlopeClip)" />
          <ellipse cx="205" cy="234" rx="7" ry="3.5" fill="#3a2810" opacity="0.55" clipPath="url(#litSlopeClip)" />
          <ellipse cx="205" cy="236" rx="7" ry="1.8" fill="#0c0804" opacity="0.35" clipPath="url(#litSlopeClip)" />
          <ellipse cx="358" cy="188" rx="6" ry="3" fill="#3a2810" opacity="0.5" clipPath="url(#litSlopeClip)" />
          <ellipse cx="358" cy="190" rx="6" ry="1.5" fill="#0c0804" opacity="0.3" clipPath="url(#litSlopeClip)" />
          <ellipse cx="498" cy="142" rx="5" ry="2.5" fill="#3a2810" opacity="0.42" clipPath="url(#litSlopeClip)" />
          <ellipse cx="498" cy="144" rx="5" ry="1.2" fill="#0c0804" opacity="0.26" clipPath="url(#litSlopeClip)" />
          <ellipse cx="648" cy="98" rx="4.5" ry="2.2" fill="#3a2810" opacity="0.36" clipPath="url(#litSlopeClip)" />
          <ellipse cx="648" cy="100" rx="4.5" ry="1.1" fill="#0c0804" opacity="0.22" clipPath="url(#litSlopeClip)" />

          {/* Small scatter stones */}
          <circle cx="65" cy="278" r="3.2" fill="#4a3018" opacity="0.45" clipPath="url(#litSlopeClip)" />
          <circle cx="140" cy="255" r="2.8" fill="#4a3018" opacity="0.4" clipPath="url(#litSlopeClip)" />
          <circle cx="305" cy="205" r="2.8" fill="#4a3018" opacity="0.38" clipPath="url(#litSlopeClip)" />
          <circle cx="415" cy="168" r="2.4" fill="#4a3018" opacity="0.34" clipPath="url(#litSlopeClip)" />
          <circle cx="535" cy="132" r="2.2" fill="#4a3018" opacity="0.3" clipPath="url(#litSlopeClip)" />
          <circle cx="688" cy="96" r="1.8" fill="#4a3018" opacity="0.26" clipPath="url(#litSlopeClip)" />
          <circle cx="186" cy="242" r="2" fill="#4a3018" opacity="0.32" clipPath="url(#litSlopeClip)" />
          <circle cx="462" cy="152" r="2" fill="#4a3018" opacity="0.28" clipPath="url(#litSlopeClip)" />

          {/* ═══════════════════════════════════════════════
               LAYER 10 — LIT SLOPE SNOW
               Bright white/warm-white — heaviest at summit,
               organic and irregular throughout
          ═══════════════════════════════════════════════ */}

          {/* ZONE 1 — SUMMIT CAP: thick, bright, nearly opaque */}
          {/* Primary cap — the very top */}
          <path
            d="M705,38 L722,30 L750,25 L780,28 L800,32 L800,44 L790,38 L772,32 L752,28 L733,28 L718,34 Z"
            fill="url(#snowSummit)"
            clipPath="url(#mountainMasterClip)"
          />
          {/* Summit fill underside */}
          <path
            d="M675,50 L695,42 L722,32 L752,27 L780,30 L800,34 L800,62 L792,50 L774,40 L754,35 L735,35 L715,40 L696,48 L680,54 Z"
            fill="#ffffff" opacity="0.72"
            clipPath="url(#litSlopeClip)"
          />
          {/* Summit snow depth accumulation */}
          <path
            d="M718,32 L745,27 L775,30 L798,34 L800,46 L790,40 L770,35 L748,32 L726,33 Z"
            fill="#ffffff" opacity="0.82"
            clipPath="url(#litSlopeClip)"
          />
          {/* Summit snow irregularities */}
          <path d="M738,28 L754,25 L768,28 L762,34 L746,34 Z" fill="#ffffff" opacity="0.88" clipPath="url(#litSlopeClip)" />
          <path d="M768,29 L784,27 L796,31 L788,37 L774,35 Z" fill="#ffffff" opacity="0.82" clipPath="url(#litSlopeClip)" />
          <path d="M752,26 L764,25 L772,28 L766,32 L756,31 Z" fill="#ffffff" opacity="0.95" clipPath="url(#litSlopeClip)" />

          {/* ZONE 2 — UPPER: large irregular snow fields */}
          <path
            d="M608,78 L645,65 L685,52 L722,40 L752,32 L764,38 L742,50 L706,60 L665,74 L630,84 L608,92 L598,85 Z"
            fill="url(#snowUpper)"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M625,72 L662,58 L702,46 L732,38 L744,44 L716,57 L676,68 L640,80 L620,86 Z"
            fill="#ffffff" opacity="0.48"
            clipPath="url(#litSlopeClip)"
          />
          {/* Large snow shelf below summit */}
          <path
            d="M655,55 L700,44 L750,32 L782,35 L800,40 L800,72 L785,58 L754,50 L715,54 L675,65 L650,72 L638,64 Z"
            fill="#e8eef8" opacity="0.38"
            clipPath="url(#litSlopeClip)"
          />
          {/* Wind-streaked snow coming off ridge */}
          <path d="M702,44 C688,50 675,46 663,54" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.4" clipPath="url(#litSlopeClip)" />
          <path d="M672,54 C658,61 646,57 636,65" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.32" clipPath="url(#litSlopeClip)" />
          <path d="M720,38 C708,43 698,40 688,46" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.28" clipPath="url(#litSlopeClip)" />
          {/* Isolated upper snowfield pocket */}
          <path d="M596,82 L622,74 L634,78 L620,90 L600,92 Z" fill="#ffffff" opacity="0.4" clipPath="url(#litSlopeClip)" />
          <path d="M560,96 L582,88 L592,92 L578,104 L558,106 Z" fill="#ffffff" opacity="0.32" clipPath="url(#litSlopeClip)" />

          {/* ZONE 3 — MID-UPPER: moderate patches with rock gaps */}
          <path
            d="M522,112 L558,100 L596,86 L628,78 L638,85 L612,96 L574,110 L540,122 L515,126 Z"
            fill="url(#snowMid)"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M556,100 L590,88 L618,82 L628,88 L602,100 L566,112 L548,110 Z"
            fill="#ffffff" opacity="0.3"
            clipPath="url(#litSlopeClip)"
          />
          {/* Small pockets */}
          <path d="M526,108 L550,98 L559,102 L538,114 Z" fill="#ffffff" opacity="0.26" clipPath="url(#litSlopeClip)" />
          <path d="M575,88 L596,80 L605,84 L585,96 Z" fill="#eef4fc" opacity="0.28" clipPath="url(#litSlopeClip)" />
          <path d="M504,118 L524,110 L530,114 L514,124 Z" fill="#ffffff" opacity="0.2" clipPath="url(#litSlopeClip)" />

          {/* Couloir snow channels — these fill vertical gullies */}
          <path d="M706,40 Q710,58 707,78 Q703,96 700,112" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.14" clipPath="url(#litSlopeClip)" />
          <path d="M706,40 Q710,58 707,78 Q703,96 700,112" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.32" clipPath="url(#litSlopeClip)" />
          <path d="M654,54 Q658,74 655,94 Q651,112 648,128" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" opacity="0.12" clipPath="url(#litSlopeClip)" />
          <path d="M654,54 Q658,74 655,94 Q651,112 648,128" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.28" clipPath="url(#litSlopeClip)" />
          <path d="M582,76 Q586,96 583,116 Q579,134 576,150" fill="none" stroke="#dde8f4" strokeWidth="3.5" strokeLinecap="round" opacity="0.1" clipPath="url(#litSlopeClip)" />
          <path d="M582,76 Q586,96 583,116 Q579,134 576,150" fill="none" stroke="#dde8f4" strokeWidth="1.4" strokeLinecap="round" opacity="0.22" clipPath="url(#litSlopeClip)" />
          <path d="M502,104 Q506,124 503,144 Q499,160 496,175" fill="none" stroke="#d4e2f0" strokeWidth="2.5" strokeLinecap="round" opacity="0.08" clipPath="url(#litSlopeClip)" />
          <path d="M502,104 Q506,124 503,144 Q499,160 496,175" fill="none" stroke="#d4e2f0" strokeWidth="1.1" strokeLinecap="round" opacity="0.18" clipPath="url(#litSlopeClip)" />
          <path d="M412,138 Q416,158 413,178 Q409,194 406,208" fill="none" stroke="#ccd8ec" strokeWidth="2" strokeLinecap="round" opacity="0.06" clipPath="url(#litSlopeClip)" />
          <path d="M412,138 Q416,158 413,178 Q409,194 406,208" fill="none" stroke="#ccd8ec" strokeWidth="0.9" strokeLinecap="round" opacity="0.14" clipPath="url(#litSlopeClip)" />

          {/* ZONE 4 — MID: scattered patches */}
          <path
            d="M402,154 L440,142 L478,132 L508,126 L516,134 L488,146 L450,158 L416,168 L400,164 Z"
            fill="url(#snowLight)"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M440,144 L474,134 L504,128 L511,136 L484,146 L450,156 L436,154 Z"
            fill="#ffffff" opacity="0.2"
            clipPath="url(#litSlopeClip)"
          />
          <path d="M410,152 L432,142 L441,146 L422,158 Z" fill="#ffffff" opacity="0.17" clipPath="url(#litSlopeClip)" />
          <path d="M460,136 L484,126 L492,130 L472,142 Z" fill="#ffffff" opacity="0.14" clipPath="url(#litSlopeClip)" />

          {/* ZONE 5 — LOWER-MID: frost streaks */}
          <path
            d="M302,200 L338,188 L378,178 L402,174 L408,182 L385,192 L348,202 L314,212 L298,208 Z"
            fill="url(#snowLight)"
            clipPath="url(#litSlopeClip)"
          />
          <path
            d="M340,190 L372,180 L398,176 L402,184 L378,194 L348,204 L334,202 Z"
            fill="#ffffff" opacity="0.09"
            clipPath="url(#litSlopeClip)"
          />
          <path d="M310,198 L330,190 L338,194 L322,204 Z" fill="#dde6f0" opacity="0.09" clipPath="url(#litSlopeClip)" />

          {/* ZONE 6 — BASE FROST: barely perceptible */}
          <path d="M178,238 L205,228 L218,232 L196,244 L180,244 Z" fill="#c8d8ea" opacity="0.09" clipPath="url(#litSlopeClip)" />
          <path d="M236,222 L260,214 L270,218 L248,228 L238,228 Z" fill="#c8d8ea" opacity="0.07" clipPath="url(#litSlopeClip)" />
          <path d="M98,262 L118,254 L124,258 L106,268 Z" fill="#b8cae0" opacity="0.06" clipPath="url(#litSlopeClip)" />
          <path d="M138,252 L156,244 L162,248 L146,258 Z" fill="#b8cae0" opacity="0.05" clipPath="url(#litSlopeClip)" />

          {/* Glowing snow halos near summit — adds luminosity */}
          <circle cx="750" cy="27" r="12" fill="#ffffff" opacity="0.12" filter="url(#snowGlow)" clipPath="url(#litSlopeClip)" />
          <circle cx="718" cy="34" r="9" fill="#ffffff" opacity="0.09" filter="url(#snowGlow)" clipPath="url(#litSlopeClip)" />
          <circle cx="684" cy="48" r="7" fill="#ffffff" opacity="0.07" filter="url(#snowGlow)" clipPath="url(#litSlopeClip)" />
          <circle cx="615" cy="82" r="5" fill="#ffffff" opacity="0.05" filter="url(#snowGlow)" clipPath="url(#litSlopeClip)" />

          {/* ═══════════════════════════════════════════════
               LAYER 11 — RIDGE LINE GLOW
               The brightest visual cue — the hot edge where
               lit slope meets cliff face. Three sub-layers.
          ═══════════════════════════════════════════════ */}

          {/* Widest outer aura — very soft golden haze */}
          <path
            d="M0,300 L40,287 L100,265 L180,244 L260,218 L340,196 L420,174 L500,152 L580,132 L650,114 L720,99 L780,96 L800,100"
            fill="none" stroke="#b08840" strokeWidth="10" opacity="0.12"
            filter="url(#ridgeGlowWide)"
          />
          {/* Mid glow layer */}
          <path
            d="M0,300 L40,287 L100,265 L180,244 L260,218 L340,196 L420,174 L500,152 L580,132 L650,114 L720,99 L780,96 L800,100"
            fill="none" stroke="#d0a860" strokeWidth="5" opacity="0.3"
            filter="url(#ridgeGlowTight)"
          />
          {/* Sharp bright line */}
          <path
            d="M0,300 L40,287 L100,265 L180,244 L260,218 L340,196 L420,174 L500,152 L580,132 L650,114 L720,99 L780,96 L800,100"
            fill="none" stroke="#d8b870" strokeWidth="2.2" opacity="0.65" strokeLinecap="round"
          />
          {/* Brightest inner highlight — almost white at the very edge */}
          <path
            d="M0,300 L40,287 L100,265 L180,244 L260,218 L340,196 L420,174 L500,152 L580,132 L650,114 L720,99 L780,96 L800,100"
            fill="none" stroke="#f0ddb0" strokeWidth="0.9" opacity="0.85" strokeLinecap="round"
          />

          {/* ═══════════════════════════════════════════════
               LAYER 12 — TOP RIDGE EDGE
               The skyline silhouette of the mountain
          ═══════════════════════════════════════════════ */}
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32"
            fill="none" stroke="#b08850" strokeWidth="1.8" opacity="0.55" strokeLinecap="round"
          />
          <path
            d="M0,300 L40,280 L100,250 L180,220 L260,190 L340,160 L420,130 L500,100 L580,72 L650,48 L720,30 L750,25 L780,28 L800,32"
            fill="none" stroke="#d4b070" strokeWidth="0.7" opacity="0.45" strokeLinecap="round"
          />

          {/* ═══════════════════════════════════════════════
               LAYER 13 — ATMOSPHERIC HAZE
               Subtle dark mist rising from the base — adds
               aerial perspective and grounds the mountain
          ═══════════════════════════════════════════════ */}
          <rect
            x="0" y="240" width="800" height="80"
            fill="url(#hazeGrad)"
            clipPath="url(#mountainMasterClip)"
            filter="url(#mistFilter)"
            opacity="0.5"
          />

          {/* ═══════════════════════════════════════════════
               LAYER 14 — PROGRESS FILL
               Accent color wash clipped to completed portion
          ═══════════════════════════════════════════════ */}
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

      {/* Progress bar + glide path milestones */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text">
            ~{currentK}K / 501K estimated hours saved
          </span>
          <span className="text-sm font-bold text-accent-light tabular-nums">
            {pct}%
          </span>
        </div>

        {/* Progress bar with quarter milestones and pace marker */}
        {(() => {
          const quarters = [
            { label: "Q1", pct: (17604 / 501000) * 100, k: "18K" },
            { label: "Q2", pct: (95844 / 501000) * 100, k: "96K" },
            { label: "Q3", pct: (293268 / 501000) * 100, k: "293K" },
          ];

          // Today's target pace
          const now = new Date();
          const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
          const yearProgress = Math.min(dayOfYear / 365, 1);
          const qBounds = [
            { t: 0, f: 0 }, { t: 0.25, f: 17604 / 501000 },
            { t: 0.5, f: 95844 / 501000 }, { t: 0.75, f: 293268 / 501000 }, { t: 1.0, f: 1.0 },
          ];
          let todayFrac = 0;
          for (let i = 0; i < qBounds.length - 1; i++) {
            if (yearProgress >= qBounds[i].t && yearProgress <= qBounds[i + 1].t) {
              const s = (yearProgress - qBounds[i].t) / (qBounds[i + 1].t - qBounds[i].t);
              todayFrac = qBounds[i].f + s * (qBounds[i + 1].f - qBounds[i].f);
              break;
            }
          }
          const todayPct = todayFrac * 100;
          const todayK = Math.round(todayFrac * 501);
          const isAhead = pct >= todayPct;

          return (
            <div className="relative">
              {/* Bar track */}
              <div className="h-3 rounded-full bg-surface-2 border border-border overflow-visible relative">
                {/* Progress fill */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, var(--color-accent), var(--color-accent-light))",
                  }}
                />

                {/* Quarter milestone markers */}
                {quarters.map((q) => (
                  <div
                    key={q.label}
                    className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: `${q.pct}%` }}
                  >
                    <div className="w-0.5 h-5 bg-text-secondary/30 -mt-1" />
                  </div>
                ))}

                {/* Pace marker — where you should be today */}
                <div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{ left: `${todayPct}%` }}
                >
                  <div className="w-3 h-3 rounded-full border-2 border-red bg-bg -ml-1.5" />
                </div>
              </div>

              {/* Labels below the bar */}
              <div className="relative h-8 mt-1">
                {/* Quarter labels */}
                {quarters.map((q) => (
                  <div
                    key={q.label}
                    className="absolute flex flex-col items-center -translate-x-1/2"
                    style={{ left: `${q.pct}%` }}
                  >
                    <span className="text-[11px] text-text font-semibold">{q.label}</span>
                    <span className="text-[11px] text-text/70 tabular-nums">{q.k}</span>
                  </div>
                ))}

                {/* Pace label */}
                <div
                  className="absolute flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${Math.min(Math.max(todayPct, 3), 97)}%` }}
                >
                  <span className={`text-[11px] font-bold ${isAhead ? "text-green" : "text-red"}`}>
                    Pace: {todayK}K
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        <p className="text-[0.68rem] text-text-secondary -mt-1">
          Estimated cumulative hours — updated weekly
        </p>
      </div>
    </div>
  );
}
