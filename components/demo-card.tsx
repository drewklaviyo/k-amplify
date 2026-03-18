import { DemoEntry } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";

function toEmbedUrl(loomUrl: string): string {
  return loomUrl.replace("/share/", "/embed/");
}

export function DemoCard({ entry }: { entry: DemoEntry }) {
  const config = ORG_BY_SLUG[entry.orgSlug];

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden mb-4 hover:border-border/80 transition-all shadow-sm shadow-black/10">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={toEmbedUrl(entry.loomUrl)}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm">{entry.title}</h3>
          <span className="text-[0.68rem] font-medium px-2 py-0.5 rounded-md bg-accent/12 text-accent-light border border-accent/25">
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
