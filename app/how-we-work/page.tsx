"use client";

import { useRef, useCallback } from "react";

const sections = [
  { id: "context", label: "Context" },
  { id: "pipeline", label: "Pipeline" },
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "rules", label: "Rules" },
  { id: "faq", label: "FAQ" },
  { id: "rollout", label: "Rollout Plan", highlight: true },
];

export default function HowWeWorkPage() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const scrollTo = useCallback((id: string) => {
    // Update the parent URL hash so the link is shareable
    window.history.replaceState(null, "", `/how-we-work#${id}`);

    // Scroll inside the iframe
    try {
      const doc = iframeRef.current?.contentDocument;
      const el = doc?.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    } catch {
      // fallback: reload iframe with hash
      if (iframeRef.current) {
        iframeRef.current.src = `/how-we-work.html?embedded=1#${id}`;
      }
    }
  }, []);

  return (
    <div className="-mx-8 -mt-4">
      {/* Sub-nav rendered natively — always visible, sticky below K Amplify nav */}
      <div className="sticky top-[52px] z-40 bg-bg/90 backdrop-blur-xl border-b border-border/60 px-8">
        <div className="max-w-[900px] mx-auto flex items-center h-[44px] gap-1 overflow-x-auto">
          <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded bg-accent text-white uppercase tracking-wider mr-3 shrink-0">Operating Rhythm</span>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`text-[0.78rem] font-medium px-2.5 py-1 rounded-lg transition-all whitespace-nowrap shrink-0 ${
                s.highlight
                  ? "text-green hover:bg-green/10"
                  : "text-text-secondary hover:text-text hover:bg-surface-2/60"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content iframe — internal nav hidden via ?embedded=1 */}
      <iframe
        ref={iframeRef}
        src="/how-we-work.html?embedded=1"
        className="w-full border-0"
        style={{ height: "calc(100vh - 96px)" }}
        title="Amplify Operating Rhythm"
      />
    </div>
  );
}
