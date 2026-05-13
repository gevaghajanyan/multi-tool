"use client";

import { useRef, useState } from "react";
import { diffLines } from "diff";
import type { Change } from "diff";
import { load as yamlLoad, dump as yamlDump } from "js-yaml";
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

type Mode = "format" | "diff" | "yaml";
type YamlDirection = "json-to-yaml" | "yaml-to-json";

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
  const [diffChanges, setDiffChanges] = useState<Change[] | null>(null);
  const [diffMaximized, setDiffMaximized] = useState(false);

  // YAML mode
  const [yamlDirection, setYamlDirection] = useState<YamlDirection>("json-to-yaml");
  const [yamlInput, setYamlInput] = useState("");
  const [yamlOutput, setYamlOutput] = useState("");
  const [yamlError, setYamlError] = useState("");
  const [yamlCopied, setYamlCopied] = useState(false);
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
      setDiffChanges(null);
      return;
    }
    const leftFmt = JSON.stringify(lr.value, null, 2);
    const rightFmt = JSON.stringify(rr.value, null, 2);
    setDiffChanges(diffLines(leftFmt, rightFmt));
  }

  function handleYamlConvert() {
    try {
      if (yamlDirection === "json-to-yaml") {
        const result = parseJsonLax(yamlInput);
        if (!result.ok) throw new Error(result.error);
        setYamlOutput(yamlDump(result.value, { indent: 2 }));
      } else {
        const parsed = yamlLoad(yamlInput);
        setYamlOutput(JSON.stringify(parsed, null, 2));
      }
      setYamlError("");
    } catch (e) {
      setYamlError(e instanceof Error ? e.message : String(e));
      setYamlOutput("");
    }
  }

  async function handleYamlCopy() {
    await navigator.clipboard.writeText(yamlOutput);
    setYamlCopied(true);
    setTimeout(() => setYamlCopied(false), 1500);
  }

  function handleYamlDownload() {
    const ext = yamlDirection === "json-to-yaml" ? "yaml" : "json";
    const mime = yamlDirection === "json-to-yaml" ? "text/yaml" : "application/json";
    const blob = new Blob([yamlOutput], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `converted.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const modeLabels: Record<Mode, string> = { format: "Formatter", diff: "Diff Checker", yaml: "YAML" };

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
      ) : mode === "yaml" ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            {(["json-to-yaml", "yaml-to-json"] as YamlDirection[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setYamlDirection(d); setYamlOutput(""); setYamlError(""); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  yamlDirection === d ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {d === "json-to-yaml" ? "JSON → YAML" : "YAML → JSON"}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-300">
              {yamlDirection === "json-to-yaml" ? "JSON input" : "YAML input"}
            </span>
            <textarea
              value={yamlInput}
              onChange={(e) => { setYamlInput(e.target.value); setYamlOutput(""); setYamlError(""); }}
              placeholder={yamlDirection === "json-to-yaml" ? "Paste JSON…" : "Paste YAML…"}
              spellCheck={false}
              className="h-52 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60"
            />
            {yamlError && <p className="font-mono text-xs text-red-400">{yamlError}</p>}
          </div>

          <button
            type="button"
            onClick={handleYamlConvert}
            disabled={!yamlInput.trim()}
            className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Convert
          </button>

          {yamlOutput && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  {yamlDirection === "json-to-yaml" ? "YAML output" : "JSON output"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleYamlCopy}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    {yamlCopied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={handleYamlDownload}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    Download
                  </button>
                </div>
              </div>
              <pre className="max-h-96 w-full overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100">
                {yamlOutput}
              </pre>
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
                  setDiffChanges(null);
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
                  setDiffChanges(null);
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

          {diffChanges !== null && (() => {
            const isIdentical = diffChanges.every((c) => !c.added && !c.removed);
            const addedCount = diffChanges.reduce((n, c) => n + (c.added ? (c.count ?? 0) : 0), 0);
            const removedCount = diffChanges.reduce((n, c) => n + (c.removed ? (c.count ?? 0) : 0), 0);

            if (isIdentical) {
              return (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 text-sm text-amber-400">
                  The two JSON values are identical.
                </div>
              );
            }

            // Build flat row list with line numbers
            type Row = { id: string; ln: number | null; rn: number | null; type: "add" | "del" | "ctx"; text: string };
            let lLine = 1, rLine = 1;
            const rows: Row[] = [];
            for (const [ci, change] of diffChanges.entries()) {
              const lines = change.value.endsWith("\n")
                ? change.value.slice(0, -1).split("\n")
                : change.value.split("\n");
              for (const [li, text] of lines.entries()) {
                if (change.removed) {
                  rows.push({ id: `${ci}-${li}`, ln: lLine++, rn: null, type: "del", text });
                } else if (change.added) {
                  rows.push({ id: `${ci}-${li}`, ln: null, rn: rLine++, type: "add", text });
                } else {
                  rows.push({ id: `${ci}-${li}`, ln: lLine++, rn: rLine++, type: "ctx", text });
                }
              }
            }

            const diffTable = (
              <div className="font-mono text-xs leading-5">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className={`flex ${
                      row.type === "add"
                        ? "bg-green-500/10"
                        : row.type === "del"
                          ? "bg-red-500/10"
                          : ""
                    }`}
                  >
                    <span className="w-10 shrink-0 select-none border-r border-zinc-800 py-0.5 pr-2 text-right text-zinc-700">
                      {row.ln ?? ""}
                    </span>
                    <span className="w-10 shrink-0 select-none border-r border-zinc-800 py-0.5 pr-2 text-right text-zinc-700">
                      {row.rn ?? ""}
                    </span>
                    <span
                      className={`w-5 shrink-0 select-none py-0.5 text-center ${
                        row.type === "add"
                          ? "text-green-500"
                          : row.type === "del"
                            ? "text-red-500"
                            : "text-zinc-700"
                      }`}
                    >
                      {row.type === "add" ? "+" : row.type === "del" ? "−" : " "}
                    </span>
                    <span
                      className={`flex-1 overflow-hidden py-0.5 pl-2 ${
                        row.type === "add"
                          ? "text-green-200"
                          : row.type === "del"
                            ? "text-red-200"
                            : "text-zinc-500"
                      }`}
                    >
                      {row.text}
                    </span>
                  </div>
                ))}
              </div>
            );

            return (
              <>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-300">Differences</span>
                    <span className="text-xs font-medium text-green-400">+{addedCount} added</span>
                    <span className="text-xs font-medium text-red-400">−{removedCount} removed</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDiffMaximized(true)}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    Expand
                  </button>
                </div>
                <div className="max-h-[480px] overflow-auto rounded-xl border border-zinc-700 bg-zinc-950">
                  {diffTable}
                </div>
              </div>

              {diffMaximized && (
                <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 p-4 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-zinc-300">Differences</span>
                      <span className="text-xs font-medium text-green-400">+{addedCount} added</span>
                      <span className="text-xs font-medium text-red-400">−{removedCount} removed</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDiffMaximized(false)}
                      className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto rounded-xl border border-zinc-700 bg-zinc-900">
                    {diffTable}
                  </div>
                </div>
              )}
              </>
            );
          })()}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
