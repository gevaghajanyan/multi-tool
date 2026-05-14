"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_TOOLS, TOOL_GROUPS, scoreTool, type ToolItem } from "@/src/lib/tools";
import { useSettings } from "@/src/context/SettingsContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-500">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/** Wrap every occurrence of `query` in the label with a highlight span. */
function HighlightedLabel({ label, query }: { label: string; query: string }) {
  if (!query.trim()) return <>{label}</>;
  const q = query.trim();
  const idx = label.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="bg-amber-400/20 text-amber-300 rounded-sm">{label.slice(idx, idx + q.length)}</mark>
      {label.slice(idx + q.length)}
    </>
  );
}

/** Returns the first keyword that matches the query (for showing a hint). */
function matchedKeyword(tool: ToolItem, query: string): string | null {
  const q = query.toLowerCase().trim();
  if (!q || tool.label.toLowerCase().includes(q)) return null;
  return tool.keywords.find((k) => k.includes(q) || k.split(/\s+/).some((w) => w.startsWith(q))) ?? null;
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const { settings } = useSettings();

  const recentItems = settings.recentTools
    .map((href) => ALL_TOOLS.find((t) => t.href === href))
    .filter(Boolean) as ToolItem[];

  const results: ToolItem[] = query.trim()
    ? ALL_TOOLS
        .map((t) => ({ tool: t, score: scoreTool(t, query) }))
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .map(({ tool }) => tool)
    : ALL_TOOLS;

  const isSearching = query.trim().length > 0;

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[activeIndex]) {
        router.push(results[activeIndex].href);
        onClose();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, results, activeIndex, onClose, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]"
      onMouseDown={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        className="relative mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-3">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, keywords, units…"
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          {!query && (
            <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[11px] text-zinc-600">Esc</kbd>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-600">No tools found for &ldquo;{query}&rdquo;</p>
          ) : isSearching ? (
            /* Flat ranked list when searching */
            results.map((tool, i) => {
              const hint = matchedKeyword(tool, query);
              return (
                <button
                  key={tool.href}
                  ref={i === activeIndex ? activeRef : undefined}
                  type="button"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => { router.push(tool.href); onClose(); }}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors duration-75 ${
                    i === activeIndex ? "bg-zinc-800" : "hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-100">
                      <HighlightedLabel label={tool.label} query={query} />
                    </span>
                    {hint && (
                      <span className="shrink-0 rounded bg-zinc-700/60 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                        {hint}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{tool.description}</p>
                </button>
              );
            })
          ) : (
            /* Grouped default view */
            <>
              {recentItems.length > 0 && (
                <div className="mb-2">
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                    Recent
                  </p>
                  {recentItems.map((tool) => {
                    const gi = ALL_TOOLS.findIndex((t) => t.href === tool.href);
                    return (
                      <button
                        key={tool.href}
                        ref={gi === activeIndex ? activeRef : undefined}
                        type="button"
                        onMouseEnter={() => setActiveIndex(gi)}
                        onClick={() => { router.push(tool.href); onClose(); }}
                        className={`w-full rounded-lg px-3 py-2 text-left transition-colors duration-75 ${
                          gi === activeIndex ? "bg-zinc-800" : "hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-300">{tool.label}</span>
                          <span className="text-[10px] text-zinc-600">↩</span>
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-600">{tool.description}</p>
                      </button>
                    );
                  })}
                  <div className="mx-3 my-2 border-t border-zinc-800" />
                </div>
              )}
              {TOOL_GROUPS.map(({ group, items }) => (
                <div key={group} className="mb-2">
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                    {group}
                  </p>
                  {items.map((tool) => {
                    const gi = ALL_TOOLS.findIndex((t) => t.href === tool.href);
                    return (
                      <button
                        key={tool.href}
                        ref={gi === activeIndex ? activeRef : undefined}
                        type="button"
                        onMouseEnter={() => setActiveIndex(gi)}
                        onClick={() => { router.push(tool.href); onClose(); }}
                        className={`w-full rounded-lg px-3 py-2 text-left transition-colors duration-75 ${
                          gi === activeIndex ? "bg-zinc-800" : "hover:bg-zinc-800/60"
                        }`}
                      >
                        <span className="text-sm text-zinc-300">{tool.label}</span>
                        <p className="mt-0.5 text-xs text-zinc-600">{tool.description}</p>
                      </button>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-zinc-800 px-4 py-2.5 text-[11px] text-zinc-600">
          <span>
            <kbd className="rounded border border-zinc-700 px-1 py-0.5">↑</kbd>{" "}
            <kbd className="rounded border border-zinc-700 px-1 py-0.5">↓</kbd>{" "}
            navigate
          </span>
          <span><kbd className="rounded border border-zinc-700 px-1 py-0.5">↵</kbd> open</span>
          <span><kbd className="rounded border border-zinc-700 px-1 py-0.5">Esc</kbd> close</span>
          {isSearching && results.length > 0 && (
            <span className="ml-auto">{results.length} result{results.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}
