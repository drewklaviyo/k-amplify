import Link from "next/link";
import { HealthBadge } from "./health-badge";
import { GoalSummary } from "@/lib/types";
import { ORG_BY_SLUG } from "@/lib/config";

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

interface OrgCardProps {
  goal: GoalSummary;
  demoCount?: number;
}

export function OrgCard({ goal, demoCount }: OrgCardProps) {
  const config = ORG_BY_SLUG[goal.orgSlug];
  const nextMilestone = goal.projects
    .flatMap((p) => p.milestones)
    .filter((m) => m.targetDate && new Date(m.targetDate) > new Date())
    .sort((a, b) => new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime())[0];

  const missingHealth = goal.projects.filter((p) => p.health === "none").length;
  const staleProjects = goal.projects.filter(
    (p) => !p.latestUpdateDate || daysSince(p.latestUpdateDate) > 14
  ).length;
  const totalProjects = goal.projects.length;

  const nudges: { label: string; color: string }[] = [];
  if (missingHealth > 0) {
    nudges.push({ label: `${missingHealth}/${totalProjects} missing health`, color: "text-orange" });
  }
  if (staleProjects > 0) {
    nudges.push({ label: `${staleProjects} stale (14d+)`, color: "text-orange" });
  }
  if (demoCount !== undefined && demoCount === 0) {
    nudges.push({ label: "No demos this month", color: "text-text-secondary" });
  }

  return (
    <Link
      href={`/roadmap?team=${goal.orgSlug}`}
      className="group block bg-surface border border-border rounded-xl p-5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm group-hover:text-accent-light transition-colors">{config.label}</h3>
        <HealthBadge status={goal.health} />
      </div>
      <p className="text-text-secondary text-xs mb-1">{config.pmOwner}</p>
      <p className="text-text-secondary text-[0.78rem] mb-3 line-clamp-2">{goal.name}</p>

      {/* Project count pill */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[0.68rem] font-medium text-text-secondary bg-surface-2 border border-border px-2 py-0.5 rounded-md">
          {totalProjects} project{totalProjects !== 1 ? "s" : ""}
        </span>
        {demoCount !== undefined && demoCount > 0 && (
          <span className="text-[0.68rem] font-medium text-accent-light bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-md">
            {demoCount} demo{demoCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {nudges.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
          {nudges.map((nudge, i) => (
            <span key={i} className={`text-[0.68rem] font-medium ${nudge.color}`}>
              {nudge.label}
            </span>
          ))}
        </div>
      )}
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
