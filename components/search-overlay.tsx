"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import type { SearchResult } from "@/app/api/search/route";

const TYPE_ICONS: Record<SearchResult["type"], string> = {
  project: "📋",
  demo: "🎬",
  shipped: "🚀",
  digest: "📝",
};

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Focus input when opened
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Cmd+K to open
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  };

  const close = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-full border border-border bg-surface-2 text-text-secondary hover:text-text hover:border-accent/30 transition-all text-xs flex items-center justify-center"
        aria-label="Search"
        title="Search (⌘K)"
      >
        🔍
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-[380px] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-[60]">
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
            <span className="text-text-secondary text-sm">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInput(e.target.value)}
              placeholder="Search projects, demos, digests…"
              className="flex-1 bg-transparent text-sm text-text placeholder:text-text-secondary/50 outline-none"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setResults([]); }}
                className="text-text-secondary hover:text-text text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Results */}
          {(results.length > 0 || loading || query.length >= 2) && (
            <div className="max-h-[360px] overflow-y-auto">
              {loading && (
                <div className="px-4 py-6 text-center text-xs text-text-secondary">
                  Searching…
                </div>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-text-secondary">
                  No results for &ldquo;{query}&rdquo;
                </div>
              )}
              {!loading && results.map((r, i) => (
                <Link
                  key={`${r.type}-${r.title}-${i}`}
                  href={r.loomUrl ?? r.href}
                  target={r.loomUrl ? "_blank" : undefined}
                  onClick={close}
                  className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-2 transition-colors"
                >
                  <span className="text-base mt-0.5">{TYPE_ICONS[r.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text truncate">{r.title}</p>
                    <p className="text-xs text-text-secondary truncate">{r.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Keyboard hint */}
          {!query && (
            <div className="px-4 py-3 text-xs text-text-secondary/50 text-center">
              Type to search · <kbd className="px-1 py-0.5 rounded bg-surface-2 text-[0.65rem]">⌘K</kbd> to toggle
            </div>
          )}
        </div>
      )}
    </div>
  );
}
