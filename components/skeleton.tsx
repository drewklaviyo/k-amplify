export function CardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-5 w-16" />
      </div>
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-3/4 mb-3" />
      <div className="flex gap-2">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-5 w-24" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-5 w-16" />
          </div>
          <div className="skeleton h-3 w-32 mb-1" />
          <div className="skeleton h-3 w-full mb-3" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="bg-surface-2 px-4 py-3 flex gap-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-3 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-4 border-t border-border flex gap-8">
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="skeleton h-3 w-20" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface border border-border rounded-xl p-5">
          <div className="skeleton h-2.5 w-24 mb-3" />
          <div className="skeleton h-7 w-16 mb-2" />
          <div className="skeleton h-2.5 w-20 mb-2" />
          <div className="skeleton h-1.5 w-full mb-2" />
          <div className="skeleton h-2.5 w-14" />
        </div>
      ))}
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-surface">
      <div className="flex">
        <div className="w-[280px] shrink-0 border-r border-border">
          <div className="border-b border-border bg-surface-2/50 px-4 py-3">
            <div className="skeleton h-3 w-16" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-5 border-b border-border flex items-center gap-3">
              <div className="skeleton w-7 h-7 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="skeleton h-3.5 w-32 mb-2" />
                <div className="skeleton h-2.5 w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 bg-[var(--bg)]">
          <div className="border-b border-border bg-surface-2/30 px-4 py-3 flex gap-16">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-3 w-12" />
            ))}
          </div>
          {[
            { w: "55%", ml: "5%" },
            { w: "70%", ml: "10%" },
            { w: "45%", ml: "15%" },
            { w: "60%", ml: "8%" },
          ].map((bar, i) => (
            <div key={i} className="px-4 py-6 border-b border-border/30">
              <div className="skeleton h-8 rounded-xl" style={{ width: bar.w, marginLeft: bar.ml }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
