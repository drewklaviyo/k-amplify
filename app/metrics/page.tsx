export default function MetricsPage() {
  return (
    <div className="pt-10">
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔥</div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Metrics Dashboard
        </h1>
        <p className="text-text-secondary text-sm mb-10">Coming soon</p>

        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto opacity-40">
          {[
            { label: "Hours Saved", value: "—" },
            { label: "Agent Autonomy Rate", value: "—" },
            { label: "Business Metrics", value: "—" },
            { label: "JTBD Coverage", value: "—" },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-surface border border-border rounded-lg p-6"
            >
              <div className="text-2xl font-bold text-accent-light mb-1">
                {card.value}
              </div>
              <div className="text-xs text-text-secondary font-semibold uppercase tracking-wide">
                {card.label}
              </div>
            </div>
          ))}
        </div>

        <p className="text-text-secondary text-xs mt-10">
          Live tracking of hours saved, agent autonomy rates, and business
          metrics across all partner orgs.
        </p>
      </div>
    </div>
  );
}
