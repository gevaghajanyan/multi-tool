"use client";

import { useRef, useState } from "react";

type Direction = "csv-to-json" | "json-to-csv";

function parseRow(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function csvToJson(text: string): string {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 1) throw new Error("Empty CSV");
  const headers = parseRow(lines[0]).map((h) => h.trim());
  if (lines.length === 1) return JSON.stringify([], null, 2);
  const rows = lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = parseRow(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
      return obj;
    });
  return JSON.stringify(rows, null, 2);
}

function escapeCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function jsonToCsv(text: string): string {
  let data: unknown;
  try { data = JSON.parse(text); }
  catch { throw new Error("Invalid JSON"); }
  if (!Array.isArray(data)) throw new Error("JSON must be an array of objects");
  if (data.length === 0) return "";
  const headers = Object.keys(data[0] as object);
  const rows = (data as Record<string, unknown>[]).map((row) =>
    headers.map((h) => escapeCell(row[h])).join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}

function download(content: string, name: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function CsvConverter() {
  const [direction, setDirection] = useState<Direction>("csv-to-json");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleConvert() {
    try {
      setOutput(direction === "csv-to-json" ? csvToJson(input) : jsonToCsv(input));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOutput("");
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInput((ev.target?.result as string) ?? "");
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const btnCls =
    "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">CSV ↔ JSON</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Convert between CSV and JSON array formats.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Direction toggle */}
        <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {(["csv-to-json", "json-to-csv"] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDirection(d); setOutput(""); setError(""); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                direction === d ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {d === "csv-to-json" ? "CSV → JSON" : "JSON → CSV"}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">
              {direction === "csv-to-json" ? "CSV input" : "JSON input"}
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.json,.txt"
                className="hidden"
                onChange={handleFile}
              />
              <button type="button" onClick={() => fileRef.current?.click()} className={btnCls}>
                Upload file
              </button>
              <button
                type="button"
                onClick={() => { setInput(""); setOutput(""); setError(""); }}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
            placeholder={
              direction === "csv-to-json"
                ? "name,age,city\nAlice,30,NYC\nBob,25,LA"
                : '[{"name":"Alice","age":30},{"name":"Bob","age":25}]'
            }
            spellCheck={false}
            className="h-48 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        </div>

        <button
          type="button"
          onClick={handleConvert}
          disabled={!input.trim()}
          className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Convert
        </button>

        {output && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">
                {direction === "csv-to-json" ? "JSON output" : "CSV output"}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={handleCopy} className={btnCls}>
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    download(
                      output,
                      direction === "csv-to-json" ? "output.json" : "output.csv",
                      direction === "csv-to-json" ? "application/json" : "text/csv",
                    )
                  }
                  className={btnCls}
                >
                  Download
                </button>
              </div>
            </div>
            <pre className="max-h-72 w-full overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100">
              {output}
            </pre>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
