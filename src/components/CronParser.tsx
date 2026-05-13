"use client";

import { useMemo, useState } from "react";

interface ParsedField {
  raw: string;
  description: string;
}

interface CronResult {
  fields: { label: string; parsed: ParsedField }[];
  nextRuns: Date[];
  error?: string;
}

function describeField(value: string, unit: string, min: number, max: number, names?: string[]): ParsedField {
  if (value === "*") return { raw: value, description: `Every ${unit}` };
  if (value === "?") return { raw: value, description: "Any" };

  const stepMatch = /^\*\/(\d+)$/.exec(value);
  if (stepMatch) {
    return { raw: value, description: `Every ${stepMatch[1]} ${unit}s` };
  }

  const rangeMatch = /^(\d+)-(\d+)$/.exec(value);
  if (rangeMatch) {
    const a = names ? names[parseInt(rangeMatch[1])] : rangeMatch[1];
    const b = names ? names[parseInt(rangeMatch[2])] : rangeMatch[2];
    return { raw: value, description: `From ${a} to ${b}` };
  }

  const listParts = value.split(",");
  if (listParts.length > 1) {
    const mapped = listParts.map((p) => names ? (names[parseInt(p)] ?? p) : p);
    return { raw: value, description: `At ${mapped.join(", ")}` };
  }

  const n = parseInt(value);
  if (!isNaN(n) && n >= min && n <= max) {
    const label = names ? names[n] : value;
    return { raw: value, description: unit === "minute" ? `At minute ${label}` : unit === "hour" ? `At ${label}:00` : `On ${label}` };
  }

  return { raw: value, description: value };
}

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function fieldMatches(value: string, current: number, _min: number, _max: number): boolean {
  if (value === "*" || value === "?") return true;
  const step = /^\*\/(\d+)$/.exec(value);
  if (step) return current % parseInt(step[1]) === 0;
  const range = /^(\d+)-(\d+)$/.exec(value);
  if (range) return current >= parseInt(range[1]) && current <= parseInt(range[2]);
  return value.split(",").some((p) => parseInt(p) === current);
}

function nextRuns(expr: string, count: number): Date[] {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  const [minF, hourF, domF, monF, dowF] = parts;
  const results: Date[] = [];
  const now = new Date();
  now.setSeconds(0, 0);
  const cursor = new Date(now.getTime() + 60_000);
  const limit = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  while (results.length < count && cursor < limit) {
    const mon = cursor.getMonth() + 1;
    const dom = cursor.getDate();
    const hour = cursor.getHours();
    const min = cursor.getMinutes();
    const dow = cursor.getDay();
    if (
      fieldMatches(monF, mon, 1, 12) &&
      fieldMatches(domF, dom, 1, 31) &&
      fieldMatches(dowF, dow, 0, 6) &&
      fieldMatches(hourF, hour, 0, 23) &&
      fieldMatches(minF, min, 0, 59)
    ) {
      results.push(new Date(cursor));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return results;
}

function parseCron(expr: string): CronResult {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { fields: [], nextRuns: [], error: "Expected 5 fields: minute hour day-of-month month day-of-week" };
  }
  const [minF, hourF, domF, monF, dowF] = parts;
  const fields = [
    { label: "Minute", parsed: describeField(minF, "minute", 0, 59) },
    { label: "Hour", parsed: describeField(hourF, "hour", 0, 23) },
    { label: "Day of month", parsed: describeField(domF, "day", 1, 31) },
    { label: "Month", parsed: describeField(monF, "month", 1, 12, MONTHS) },
    { label: "Day of week", parsed: describeField(dowF, "weekday", 0, 6, DAYS) },
  ];
  const runs = nextRuns(expr, 5);
  return { fields, nextRuns: runs };
}

const EXAMPLES = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Every hour", expr: "0 * * * *" },
  { label: "Daily at midnight", expr: "0 0 * * *" },
  { label: "Every Mon 9am", expr: "0 9 * * 1" },
  { label: "1st of month", expr: "0 0 1 * *" },
];

export function CronParser() {
  const [input, setInput] = useState("*/5 * * * *");

  const result = useMemo<CronResult>(() => {
    if (!input.trim()) return { fields: [], nextRuns: [] };
    return parseCron(input);
  }, [input]);

  const fmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Cron Parser</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Explain a cron expression and see the next scheduled runs.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Expression</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="* * * * *"
            spellCheck={false}
            className={`w-full rounded-xl border ${result.error ? "border-red-500/50" : "border-zinc-700"} bg-zinc-900 px-3 py-2 font-mono text-lg text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60`}
          />
          {result.error && <p className="font-mono text-xs text-red-400">{result.error}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.expr}
              type="button"
              onClick={() => setInput(ex.expr)}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-amber-400/40 hover:text-amber-400"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {result.fields.length > 0 && (
          <>
            <div className="grid grid-cols-5 gap-2">
              {result.fields.map(({ label, parsed }) => (
                <div key={label} className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-2">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">{label}</p>
                  <p className="font-mono text-sm font-bold text-amber-400">{parsed.raw}</p>
                  <p className="text-[10px] text-zinc-400 leading-tight">{parsed.description}</p>
                </div>
              ))}
            </div>

            {result.nextRuns.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">Next 5 runs</span>
                <div className="flex flex-col divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
                  {result.nextRuns.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2">
                      <span className="w-5 shrink-0 text-xs text-zinc-600">{i + 1}</span>
                      <span className="font-mono text-sm text-zinc-200">{fmt.format(d)}</span>
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
