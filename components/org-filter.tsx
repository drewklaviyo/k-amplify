"use client";

import { OrgSlug } from "@/lib/types";
import { ORG_CONFIGS } from "@/lib/config";

interface OrgFilterProps {
  selected: OrgSlug | "all";
  onChange: (slug: OrgSlug | "all") => void;
}

export function OrgFilter({ selected, onChange }: OrgFilterProps) {
  const options: { slug: OrgSlug | "all"; label: string }[] = [
    { slug: "all", label: "All" },
    ...ORG_CONFIGS.map((c) => ({ slug: c.slug, label: c.label })),
  ];

  return (
    <div className="flex gap-1 mb-6">
      {options.map((opt) => (
        <button
          key={opt.slug}
          onClick={() => onChange(opt.slug)}
          className={`text-[0.78rem] font-medium px-3 py-1.5 rounded-md transition-all border ${
            selected === opt.slug
              ? "text-accent-light bg-accent/12 border-accent/25"
              : "text-text-secondary bg-surface border-border hover:text-text hover:bg-surface-2"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
