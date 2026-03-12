import Link from "next/link";
import { HealthBadge } from "./health-badge";
import { GoalSummary } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";

export function OrgCard({ goal }: { goal: GoalSummary }) {
  const config = ORG_BY_SLUG[goal.orgSlug];
  const nextMilestone = goal.projects
    .flatMap((p) => p.milestones)
    .filter((m) => m.targetDate && new Date(m.targetDate) > new Date())
    .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())[0];

  return (
    <Link
      href={`/roadmap?team=${goal.orgSlug}`}
      className="block bg-surface border border-border rounded-xl p-5 hover:border-accent/40 transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{config.label}</h3>
        <HealthBadge status={goal.health} />
      </div>
      <p className="text-text-secondary text-xs mb-1">{config.pmOwner}</p>
      <p className="text-text-secondary text-[0.78rem] mb-3 line-clamp-2">{goal.name}</p>
      {nextMilestone && (
        <div className="text-xs text-text-secondary border-t border-border pt-2 mt-auto">
          <span className="text-accent-light font-medium">Next:</span>{" "}
          {nextMilestone.name}
          {nextMilestone.targetDate && (
            <span className="ml-1">
              ({new Date(nextMilestone.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })})
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
