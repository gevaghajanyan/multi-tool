"use client";

import { useState } from "react";

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

interface Param {
  id: string;
  key: string;
  value: string;
}

const FIELDS: { label: string; get: (u: URL) => string }[] = [
  { label: "Protocol", get: (u) => u.protocol },
  { label: "Host", get: (u) => u.hostname },
  { label: "Port", get: (u) => u.port },
  { label: "Path", get: (u) => u.pathname },
  { label: "Hash", get: (u) => u.hash },
];

function rebuildUrl(base: string, params: Param[]): string {
  try {
    const url = new URL(base);
    url.search = "";
    for (const p of params) {
      if (p.key.trim()) url.searchParams.append(p.key, p.value);
    }
    return url.toString();
  } catch {
    return base;
  }
}

export function UrlParser() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<URL | null>(null);
  const [params, setParams] = useState<Param[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function parse(value: string) {
    setInput(value);
    if (!value.trim()) { setParsed(null); setParams([]); setError(""); return; }
    try {
      const url = new URL(value);
      setParsed(url);
      setParams([...url.searchParams.entries()].map(([k, v]) => ({ id: makeId(), key: k, value: v })));
      setError("");
    } catch {
      setParsed(null);
      setParams([]);
      setError("Invalid URL");
    }
  }

  function syncParams(newParams: Param[]) {
    setParams(newParams);
    const rebuilt = rebuildUrl(input, newParams);
    setInput(rebuilt);
    try { setParsed(new URL(rebuilt)); } catch {}
  }

  function addParam() {
    syncParams([...params, { id: makeId(), key: "", value: "" }]);
  }

  function removeParam(id: string) {
    syncParams(params.filter((p) => p.id !== id));
  }

  function updateParam(id: string, field: "key" | "value", value: string) {
    syncParams(params.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const fieldCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">URL Parser</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Break a URL into its parts and edit query parameters.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* URL input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">URL</span>
            {input && (
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => parse(e.target.value)}
            placeholder="https://example.com/path?key=value#anchor"
            spellCheck={false}
            className={`w-full rounded-xl border ${error ? "border-red-500/50" : "border-zinc-700"} bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60`}
          />
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        </div>

        {parsed && (
          <>
            {/* Parsed parts */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FIELDS.map(({ label, get }) => {
                const val = get(parsed);
                if (!val) return null;
                return (
                  <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                      {label}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-xs text-zinc-300">{val}</p>
                  </div>
                );
              })}
            </div>

            {/* Query params */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">Query params</span>
                <button
                  type="button"
                  onClick={addParam}
                  className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  + Add
                </button>
              </div>

              {params.length === 0 ? (
                <p className="text-xs text-zinc-600">No query parameters</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {params.map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={p.key}
                        onChange={(e) => updateParam(p.id, "key", e.target.value)}
                        placeholder="key"
                        className={fieldCls}
                      />
                      <span className="shrink-0 text-zinc-600">=</span>
                      <input
                        type="text"
                        value={p.value}
                        onChange={(e) => updateParam(p.id, "value", e.target.value)}
                        placeholder="value"
                        className={fieldCls}
                      />
                      <button
                        type="button"
                        onClick={() => removeParam(p.id)}
                        className="shrink-0 rounded-md px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
