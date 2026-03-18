import { HealthStatus } from "@/lib/types";

const statusConfig: Record<HealthStatus, { label: string; className: string; dotClassName: string }> = {
  onTrack: { label: "On Track", className: "text-green bg-green/10 border-green/25", dotClassName: "bg-green" },
  atRisk: { label: "At Risk", className: "text-orange bg-orange/10 border-orange/25", dotClassName: "bg-orange" },
  offTrack: { label: "Off Track", className: "text-red bg-red/10 border-red/25", dotClassName: "bg-red" },
  none: { label: "No Status", className: "text-text-secondary bg-surface-2 border-border", dotClassName: "bg-text-secondary/40" },
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[0.68rem] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClassName}`} />
      {config.label}
    </span>
  );
}
