import { HealthStatus } from "@/lib/types";

const statusConfig: Record<HealthStatus, { label: string; className: string }> = {
  onTrack: { label: "On Track", className: "text-green bg-green/10 border-green/25" },
  atRisk: { label: "At Risk", className: "text-orange bg-orange/10 border-orange/25" },
  offTrack: { label: "Off Track", className: "text-red bg-red/10 border-red/25" },
  none: { label: "No Status", className: "text-text-secondary bg-surface-2 border-border" },
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const config = statusConfig[status];
  return (
    <span className={`text-[0.68rem] font-semibold px-2 py-0.5 rounded border ${config.className}`}>
      {config.label}
    </span>
  );
}
