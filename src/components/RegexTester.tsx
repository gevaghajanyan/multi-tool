"use client";

import { useMemo, useState } from "react";

const ALL_FLAGS = [
  { flag: "g", title: "Global — find all matches" },
  { flag: "i", title: "Case insensitive" },
  { flag: "m", title: "Multiline — ^ and $ match line boundaries" },
  { flag: "s", title: "Dot all — . matches newlines" },
];

interface Match {
  value: string;
  start: number;
  end: number;
  groups: (string | undefined)[];
  namedGroups: Record<string, string> | null;
}

function computeMatches(pattern: string, flags: string, text: string): Match[] | Error {
  if (!pattern) return [];
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    return e instanceof Error ? e : new Error(String(e));
  }

  const results: Match[] = [];
  if (flags.includes("g")) {
    const r = new RegExp(pattern, flags);
    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = r.exec(text)) !== null && safety++ < 1000) {
      results.push({
        value: m[0],
        start: m.index,
        end: m.index + m[0].length,
        groups: Array.from({ length: m.length - 1 }, (_, i) => m![i + 1]),
        namedGroups: m.groups ? { ...m.groups } : null,
      });
      if (m[0].length === 0) r.lastIndex++;
    }
  } else {
    const m = regex.exec(text);
    if (m) {
      results.push({
        value: m[0],
        start: m.index,
        end: m.index + m[0].length,
        groups: Array.from({ length: m.length - 1 }, (_, i) => m![i + 1]),
        namedGroups: m.groups ? { ...m.groups } : null,
      });
    }
  }
  return results;
}

type Segment = { type: "text" | "match"; value: string };

function buildSegments(text: string, matches: Match[]): Segment[] {
  const segs: Segment[] = [];
  let last = 0;
  for (const m of matches) {
    if (m.start > last) segs.push({ type: "text", value: text.slice(last, m.start) });
    segs.push({ type: "match", value: m.value });
    last = m.end;
  }
  if (last < text.length) segs.push({ type: "text", value: text.slice(last) });
  return segs;
}

export function RegexTester() {
  const [pattern, setPattern] = useState("");
  const [activeFlags, setActiveFlags] = useState<Set<string>>(new Set(["g"]));
  const [testString, setTestString] = useState("");

  const flags = [...activeFlags].sort().join("");

  function toggleFlag(flag: string) {
    setActiveFlags((prev) => {
      const next = new Set(prev);
      next.has(flag) ? next.delete(flag) : next.add(flag);
      return next;
    });
  }

  const result = useMemo(
    () => computeMatches(pattern, flags, testString),
    [pattern, flags, testString],
  );

  const isError = result instanceof Error;
  const matches: Match[] = isError ? [] : result;

  const segments = useMemo(
    () => (matches.length > 0 ? buildSegments(testString, matches) : null),
    [testString, matches],
  );

  const hasResults = testString && pattern && !isError;

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Regex Tester</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Test regular expressions with live match highlighting.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Pattern row */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Pattern</span>
          <div className="flex items-center gap-2">
            <div
              className={`flex flex-1 items-center rounded-xl border bg-zinc-900 px-3 transition-colors duration-150 focus-within:border-amber-400/60 ${
                isError && pattern ? "border-red-500/50" : "border-zinc-700"
              }`}
            >
              <span className="select-none font-mono text-zinc-500">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="your pattern"
                spellCheck={false}
                className="flex-1 bg-transparent px-1 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none"
              />
              <span className="select-none font-mono text-zinc-500">/{flags}</span>
            </div>
            <div className="flex gap-1">
              {ALL_FLAGS.map(({ flag, title }) => (
                <button
                  key={flag}
                  type="button"
                  title={title}
                  onClick={() => toggleFlag(flag)}
                  className={`h-8 w-8 rounded-lg font-mono text-xs font-semibold transition-colors duration-150 ${
                    activeFlags.has(flag)
                      ? "border border-amber-400/40 bg-amber-400/20 text-amber-400"
                      : "border border-zinc-700 bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {flag}
                </button>
              ))}
            </div>
          </div>
          {isError && pattern && (
            <p className="font-mono text-xs text-red-400">{result.message}</p>
          )}
        </div>

        {/* Test string */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Test string</span>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Enter text to test against…"
            spellCheck={false}
            className="h-36 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60"
          />
        </div>

        {hasResults && (
          <>
            {/* Summary badge */}
            <div
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                matches.length > 0
                  ? "bg-amber-400/10 text-amber-400"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {matches.length === 0
                ? "No matches"
                : `${matches.length} match${matches.length === 1 ? "" : "es"}`}
            </div>

            {/* Highlighted preview */}
            {segments && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">Preview</span>
                <div className="max-h-48 overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm leading-6 whitespace-pre-wrap break-all text-zinc-400">
                  {segments.map((seg, i) =>
                    seg.type === "match" ? (
                      <mark key={i} className="rounded bg-amber-400/25 not-italic text-amber-300">
                        {seg.value}
                      </mark>
                    ) : (
                      <span key={i}>{seg.value}</span>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Match list */}
            {matches.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">Matches</span>
                <div className="flex max-h-64 flex-col gap-1.5 overflow-auto">
                  {matches.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0 text-zinc-600">#{i + 1}</span>
                        <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-amber-300">
                          {m.value || <em className="text-zinc-600">empty match</em>}
                        </span>
                        <span className="text-zinc-600">
                          index {m.start}–{m.end}
                        </span>
                      </div>
                      {(m.groups.length > 0 || m.namedGroups) && (
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 pl-8">
                          {m.groups.map((g, gi) => (
                            <span key={gi} className="text-zinc-500">
                              <span className="text-zinc-600">Group {gi + 1}:</span>{" "}
                              {g !== undefined ? (
                                <span className="text-sky-400">{g}</span>
                              ) : (
                                <span className="text-zinc-700">undefined</span>
                              )}
                            </span>
                          ))}
                          {m.namedGroups &&
                            Object.entries(m.namedGroups).map(([name, val]) => (
                              <span key={name} className="text-zinc-500">
                                <span className="text-zinc-600">{name}:</span>{" "}
                                <span className="text-sky-400">{val}</span>
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
