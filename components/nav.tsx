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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/85 backdrop-blur-xl border-b border-border px-8">
      <div className="max-w-[900px] mx-auto flex items-center h-[52px] gap-8">
        <Link href="/" className="font-bold text-[0.92rem] tracking-tight flex items-center gap-2 whitespace-nowrap">
          🔥 K Amplify
        </Link>
        <div className="flex gap-0.5">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[0.78rem] font-medium px-2.5 py-1.5 rounded-md transition-all ${
                pathname === link.href
                  ? "text-text bg-surface-2"
                  : "text-text-secondary hover:text-text hover:bg-surface-2"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
