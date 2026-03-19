"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayout } from "./layout-context";

const links = [
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/demos", label: "Demos" },
  { href: "/shipped", label: "Shipped" },
  { href: "/digests", label: "Digests" },
  { href: "/intake", label: "Intake" },
  { href: "/how-we-work", label: "How We Work" },
];

export function Nav() {
  const pathname = usePathname();
  const { isWide } = useLayout();

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-accent focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-2xl border-b border-border/60" role="navigation" aria-label="Main navigation">
        <div className={`mx-auto flex items-center h-[52px] px-8 gap-8 transition-[max-width] duration-300 ${isWide ? "max-w-[1200px]" : "max-w-[900px]"}`}>
          <Link
            href="/"
            className="font-bold text-[0.92rem] tracking-tight flex items-center gap-2.5 whitespace-nowrap hover:opacity-80 transition-opacity"
            aria-label="K Amplify home"
          >
            <img src="/icon.svg" alt="" className="w-6 h-6" aria-hidden="true" />
            <span>Amplify</span>
          </Link>
          <div className="flex gap-0.5 overflow-x-auto" role="tablist" aria-label="Page navigation">
            {links.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  role="tab"
                  aria-selected={isActive}
                  className={`text-[0.78rem] font-medium px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? "text-text bg-surface-2 shadow-sm"
                      : "text-text-secondary hover:text-text hover:bg-surface-2/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
