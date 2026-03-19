import { DemoEntry, OrgSlug } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";

const ORG_COLORS: Record<OrgSlug, string> = {
  sales: "#6c5ce7",
  demos: "#a29bfe",
  support: "#00b894",
  cs: "#74b9ff",
  rnd: "#fdcb6e",
  marketing: "#e17055",
};

function toEmbedUrl(loomUrl: string): string {
  return loomUrl.replace("/share/", "/embed/");
}

export function DemoCard({ entry }: { entry: DemoEntry }) {
  const config = ORG_BY_SLUG[entry.orgSlug];
  const orgColor = ORG_COLORS[entry.orgSlug] ?? "#6c5ce7";

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all shadow-sm shadow-black/10 group">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={toEmbedUrl(entry.loomUrl)}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
          title={`Demo: ${entry.title}`}
        />
        {/* Play button overlay hint */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm">{entry.title}</h3>
          <span
            className="text-[0.68rem] font-medium px-2 py-0.5 rounded-md border"
            style={{ backgroundColor: orgColor + "1F", color: orgColor, borderColor: orgColor + "40" }}
          >
            {config.label}
          </span>
        </div>
        <p className="text-text-secondary text-xs">
          {entry.projectName} &middot;{" "}
          {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}
