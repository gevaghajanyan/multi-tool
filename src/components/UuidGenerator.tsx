"use client";

import { useState } from "react";
import { ulid } from "ulid";

type Mode = "uuid" | "ulid";

export function UuidGenerator() {
  const [mode, setMode] = useState<Mode>("uuid");
  const [ids, setIds] = useState<string[]>(() => [crypto.randomUUID()]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  function generate() {
    const n = Math.max(1, Math.min(100, count));
    setIds(
      Array.from({ length: n }, () =>
        mode === "uuid" ? crypto.randomUUID() : ulid(),
      ),
    );
  }

  function handleModeChange(next: Mode) {
    setMode(next);
    setIds([next === "uuid" ? crypto.randomUUID() : ulid()]);
  }

  async function copySingle(id: string, i: number) {
    await navigator.clipboard.writeText(id);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  async function copyAll() {
    await navigator.clipboard.writeText(ids.join("\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1500);
  }

  const btnCls =
    "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          UUID / ULID Generator
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Generate unique identifiers locally — nothing is uploaded.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Mode toggle */}
        <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {(["uuid", "ulid"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                mode === m
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Mode description */}
        <p className="text-xs text-zinc-500">
          {mode === "uuid"
            ? "UUID v4 — 128-bit random identifier (RFC 4122)"
            : "ULID — 128-bit sortable identifier: 48-bit timestamp + 80-bit random"}
        </p>

        {/* Count + Generate */}
        <div className="flex items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Count</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) =>
                setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <button
            type="button"
            onClick={generate}
            className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300"
          >
            Generate
          </button>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">
              {ids.length} {mode.toUpperCase()}
              {ids.length !== 1 ? "s" : ""}
            </span>
            {ids.length > 1 && (
              <button type="button" onClick={copyAll} className={btnCls}>
                {copiedAll ? "Copied!" : "Copy all"}
              </button>
            )}
          </div>
          <div className="flex max-h-80 flex-col gap-1 overflow-auto">
            {ids.map((id, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2"
              >
                <span className="font-mono text-sm text-zinc-200">{id}</span>
                <button
                  type="button"
                  onClick={() => copySingle(id, i)}
                  className={`${btnCls} shrink-0`}
                >
                  {copiedIndex === i ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
