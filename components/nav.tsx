"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-2xl border-b border-border/60">
      <div className="max-w-[900px] mx-auto flex items-center h-[52px] px-8 gap-8">
        <Link
          href="/"
          className="font-bold text-[0.92rem] tracking-tight flex items-center gap-2 whitespace-nowrap hover:opacity-80 transition-opacity"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
            <span className="text-white text-[10px] font-black">K</span>
          </div>
          <span>Amplify</span>
        </Link>
        <div className="flex gap-0.5 overflow-x-auto">
          {links.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
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
  );
}
