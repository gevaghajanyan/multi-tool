"use client";

import { useEffect, useState } from "react";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
];

function formatDate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatIso(date: Date): string {
  return date.toISOString();
}

function parseInput(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!isNaN(n)) {
    const ms = trimmed.length <= 10 ? n * 1000 : n;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

export function TimestampConverter() {
  const [input, setInput] = useState("");
  const [tz, setTz] = useState("UTC");
  const [date, setDate] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!input.trim()) { setDate(null); setError(""); return; }
    const d = parseInput(input);
    if (d) { setDate(d); setError(""); }
    else { setDate(null); setError("Unrecognised format — try a Unix timestamp or ISO date string"); }
  }, [input]);

  function setNow() {
    const now = Date.now();
    setInput(String(Math.floor(now / 1000)));
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  const epochSec = date ? Math.floor(date.getTime() / 1000) : null;
  const epochMs = date ? date.getTime() : null;

  const rows: { label: string; value: string; key: string }[] = date
    ? [
        { label: "Unix (seconds)", value: String(epochSec), key: "sec" },
        { label: "Unix (milliseconds)", value: String(epochMs), key: "ms" },
        { label: "ISO 8601", value: formatIso(date), key: "iso" },
        { label: `Local (${tz})`, value: formatDate(date, tz), key: "local" },
        { label: "UTC", value: formatDate(date, "UTC"), key: "utc" },
        { label: "Day of week", value: new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(date), key: "dow" },
      ]
    : [];

  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Timestamp Converter</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Convert Unix timestamps and date strings across timezones.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Input</span>
            <button type="button" onClick={setNow} className={btnCls}>Now</button>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1715000000 or 2024-05-06T12:00:00Z"
            spellCheck={false}
            className={`w-full rounded-xl border ${error ? "border-red-500/50" : "border-zinc-700"} bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60`}
          />
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-300">Timezone</span>
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
          >
            {TIMEZONES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {rows.length > 0 && (
          <div className="flex flex-col gap-2">
            {rows.map(({ label, value, key }) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">{label}</p>
                  <p className="mt-0.5 truncate font-mono text-sm text-zinc-200">{value}</p>
                </div>
                <button type="button" onClick={() => copy(value, key)} className={`${btnCls} shrink-0`}>
                  {copiedKey === key ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
