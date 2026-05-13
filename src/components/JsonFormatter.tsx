"use client";

import { useRef, useState } from "react";
import { JsonTree } from "./JsonTree";

type ParseResult =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

function parseJsonLax(input: string): ParseResult {
  const s = input.trim();
  if (!s) return { ok: false, error: "Input is empty" };

  try {
    return { ok: true, value: JSON.parse(s) };
  } catch {}

  // Handle common JS object notation: unquoted keys, single quotes, trailing commas, comments
  try {
    let t = s;
    t = t.replace(/\/\/[^\n]*/g, "");
    t = t.replace(/\/\*[\s\S]*?\*\//g, "");
    t = t.replace(/(^|[{,\[])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
    t = t.replace(/'/g, '"');
    t = t.replace(/,(\s*[}\]])/g, "$1");
    return { ok: true, value: JSON.parse(t) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

type DiffEntry = {
  path: string;
  type: "added" | "removed" | "changed";
  left?: string;
  right?: string;
};

function truncate(s: string, max = 100): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}

function diffJson(left: unknown, right: unknown, path = "$"): DiffEntry[] {
  const entries: DiffEntry[] = [];

  const leftIsArray = Array.isArray(left);
  const rightIsArray = Array.isArray(right);
  const leftIsNull = left === null;
  const rightIsNull = right === null;
  const leftType = leftIsNull ? "null" : leftIsArray ? "array" : typeof left;
  const rightType = rightIsNull ? "null" : rightIsArray ? "array" : typeof right;

  if (leftType !== rightType) {
    entries.push({
      path,
      type: "changed",
      left: truncate(JSON.stringify(left)),
      right: truncate(JSON.stringify(right)),
    });
    return entries;
  }

  if (leftIsArray && rightIsArray) {
    const len = Math.max((left as unknown[]).length, (right as unknown[]).length);
    for (let i = 0; i < len; i++) {
      const l = left as unknown[];
      const r = right as unknown[];
      if (i >= l.length) {
        entries.push({ path: `${path}[${i}]`, type: "added", right: truncate(JSON.stringify(r[i])) });
      } else if (i >= r.length) {
        entries.push({ path: `${path}[${i}]`, type: "removed", left: truncate(JSON.stringify(l[i])) });
      } else {
        entries.push(...diffJson(l[i], r[i], `${path}[${i}]`));
      }
    }
    return entries;
  }

  if (leftType === "object" && !leftIsNull) {
    const l = left as Record<string, unknown>;
    const r = right as Record<string, unknown>;
    const keys = new Set([...Object.keys(l), ...Object.keys(r)]);
    for (const key of keys) {
      const childPath = `${path}.${key}`;
      if (!(key in l)) {
        entries.push({ path: childPath, type: "added", right: truncate(JSON.stringify(r[key])) });
      } else if (!(key in r)) {
        entries.push({ path: childPath, type: "removed", left: truncate(JSON.stringify(l[key])) });
      } else {
        entries.push(...diffJson(l[key], r[key], childPath));
      }
    }
    return entries;
  }

  if (left !== right) {
    entries.push({
      path,
      type: "changed",
      left: truncate(String(left)),
      right: truncate(String(right)),
    });
  }
  return entries;
}

type Mode = "format" | "diff";

export function JsonFormatter() {
  const [mode, setMode] = useState<Mode>("format");

  // Format mode
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [parsedValue, setParsedValue] = useState<unknown>(undefined);
  const [formatError, setFormatError] = useState("");
  const [copied, setCopied] = useState(false);
  const [viewRaw, setViewRaw] = useState(false);
  const [maximized, setMaximized] = useState(false);

  // Diff mode
  const [leftInput, setLeftInput] = useState("");
  const [rightInput, setRightInput] = useState("");
  const [diffEntries, setDiffEntries] = useState<DiffEntry[] | null>(null);
  const [leftError, setLeftError] = useState("");
  const [rightError, setRightError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  function readFile(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter((ev.target?.result as string) ?? "");
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleFormat() {
    const result = parseJsonLax(input);
    if (!result.ok) {
      setFormatError(result.error);
      setOutput("");
      setParsedValue(undefined);
      return;
    }
    setFormatError("");
    setOutput(JSON.stringify(result.value, null, 2));
    setParsedValue(result.value);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    const blob = new Blob([output], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCompare() {
    const lr = parseJsonLax(leftInput);
    const rr = parseJsonLax(rightInput);
    setLeftError(!lr.ok ? lr.error : "");
    setRightError(!rr.ok ? rr.error : "");
    if (!lr.ok || !rr.ok) {
      setDiffEntries(null);
      return;
    }
    setDiffEntries(diffJson(lr.value, rr.value));
  }

  const modeLabels: Record<Mode, string> = { format: "Formatter", diff: "Diff Checker" };

  return (
    <div className="w-full max-w-4xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          JSON Tools
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Format, parse, and diff JSON or JavaScript objects.
        </p>
      </header>

      {/* Mode tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
        {(["format", "diff"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors duration-150 ${
              mode === m
                ? "bg-amber-400 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {mode === "format" ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          {/* Input */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Input</span>
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,.js,.txt"
                  className="hidden"
                  onChange={(e) => readFile(e, setInput)}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                >
                  Upload file
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    setOutput("");
                    setFormatError("");
                    setParsedValue(undefined);
                  }}
                  className="text-xs text-zinc-500 transition-colors duration-150 hover:text-zinc-300"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={"Paste JSON or JS object here…\n\n{ name: 'Alice', age: 30 }"}
              spellCheck={false}
              className="h-52 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60"
            />
            {formatError && (
              <p className="font-mono text-xs text-red-400">{formatError}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleFormat}
            disabled={!input.trim()}
            className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Format
          </button>

          {parsedValue !== undefined && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-300">Output</span>
                  <div className="flex rounded-lg border border-zinc-700 bg-zinc-900 p-0.5">
                    {(["Tree", "Raw"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setViewRaw(v === "Raw")}
                        className={`rounded px-2.5 py-0.5 text-xs transition-colors duration-150 ${
                          (v === "Raw") === viewRaw
                            ? "bg-zinc-700 text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMaximized(true)}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    Expand
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    Download
                  </button>
                </div>
              </div>
              <div className="max-h-96 w-full overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 p-3">
                {viewRaw ? (
                  <pre className="font-mono text-sm text-zinc-100">{output}</pre>
                ) : (
                  <JsonTree value={parsedValue} />
                )}
              </div>
            </div>
          )}

          {maximized && (
            <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-300">Output</span>
                  <div className="flex rounded-lg border border-zinc-700 bg-zinc-900 p-0.5">
                    {(["Tree", "Raw"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setViewRaw(v === "Raw")}
                        className={`rounded px-2.5 py-0.5 text-xs transition-colors duration-150 ${
                          (v === "Raw") === viewRaw
                            ? "bg-zinc-700 text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaximized(false)}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 p-4">
                {viewRaw ? (
                  <pre className="font-mono text-sm text-zinc-100">{output}</pre>
                ) : (
                  <JsonTree value={parsedValue} />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Left panel */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  Left — original
                </span>
                <div className="flex items-center gap-2">
                  <input
                    ref={leftFileRef}
                    type="file"
                    accept=".json,.js,.txt"
                    className="hidden"
                    onChange={(e) => readFile(e, setLeftInput)}
                  />
                  <button
                    type="button"
                    onClick={() => leftFileRef.current?.click()}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    Upload
                  </button>
                </div>
              </div>
              <textarea
                value={leftInput}
                onChange={(e) => {
                  setLeftInput(e.target.value);
                  setDiffEntries(null);
                }}
                placeholder="Original JSON…"
                spellCheck={false}
                className="h-52 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60"
              />
              {leftError && (
                <p className="font-mono text-xs text-red-400">{leftError}</p>
              )}
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  Right — modified
                </span>
                <div className="flex items-center gap-2">
                  <input
                    ref={rightFileRef}
                    type="file"
                    accept=".json,.js,.txt"
                    className="hidden"
                    onChange={(e) => readFile(e, setRightInput)}
                  />
                  <button
                    type="button"
                    onClick={() => rightFileRef.current?.click()}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    Upload
                  </button>
                </div>
              </div>
              <textarea
                value={rightInput}
                onChange={(e) => {
                  setRightInput(e.target.value);
                  setDiffEntries(null);
                }}
                placeholder="Modified JSON…"
                spellCheck={false}
                className="h-52 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60"
              />
              {rightError && (
                <p className="font-mono text-xs text-red-400">{rightError}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCompare}
            disabled={!leftInput.trim() || !rightInput.trim()}
            className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Compare
          </button>

          {diffEntries !== null && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-300">
                {diffEntries.length === 0
                  ? "No differences found"
                  : `${diffEntries.length} difference${diffEntries.length === 1 ? "" : "s"} found`}
              </p>
              {diffEntries.length === 0 ? (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-400">
                  The two JSON values are identical.
                </div>
              ) : (
                <div className="flex max-h-96 flex-col gap-1 overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 p-3">
                  {diffEntries.map((entry, i) => (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 font-mono text-xs ${
                        entry.type === "added"
                          ? "bg-green-500/10 text-green-300"
                          : entry.type === "removed"
                            ? "bg-red-500/10 text-red-300"
                            : "bg-amber-500/10 text-amber-300"
                      }`}
                    >
                      <span className="font-semibold">{entry.path}</span>
                      {entry.type === "added" && (
                        <span className="ml-2 text-zinc-400">
                          added: {entry.right}
                        </span>
                      )}
                      {entry.type === "removed" && (
                        <span className="ml-2 text-zinc-400">
                          removed: {entry.left}
                        </span>
                      )}
                      {entry.type === "changed" && (
                        <span className="ml-2 text-zinc-400">
                          {entry.left}{" "}
                          <span className="text-zinc-500">→</span>{" "}
                          {entry.right}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
