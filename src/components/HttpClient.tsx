"use client";

import { useState, useRef } from "react";
import { JsonTree } from "@/src/components/JsonTree";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
type Method = (typeof METHODS)[number];

const BODY_METHODS = new Set<Method>(["POST", "PUT", "PATCH"]);
const BODY_TYPES = ["JSON", "Form", "Raw"] as const;
type BodyType = (typeof BODY_TYPES)[number];
type RequestTab = "params" | "headers" | "body";
type ResponseTab = "body" | "headers";

interface KVRow {
  id: number;
  key: string;
  value: string;
  enabled: boolean;
}

interface ResponseData {
  status: number;
  statusText: string;
  headers: [string, string][];
  body: string;
  ms: number;
  size: number;
}

interface HistoryEntry {
  method: Method;
  url: string;
  status: number | null;
  ts: number;
}

let _id = 0;
const mkRow = (): KVRow => ({ id: _id++, key: "", value: "", enabled: true });

function ensureTrailingEmpty(rows: KVRow[]): KVRow[] {
  const last = rows[rows.length - 1];
  if (!last || last.key || last.value) return [...rows, mkRow()];
  return rows;
}

function KVEditor({
  rows,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: {
  rows: KVRow[];
  onChange: (rows: KVRow[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  function set(id: number, field: keyof KVRow, val: string | boolean) {
    onChange(ensureTrailingEmpty(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r))));
  }

  function remove(id: number) {
    onChange(ensureTrailingEmpty(rows.filter((r) => r.id !== id)));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => set(row.id, "enabled", e.target.checked)}
            className="h-3.5 w-3.5 shrink-0 accent-amber-400"
          />
          <input
            type="text"
            value={row.key}
            onChange={(e) => set(row.id, "key", e.target.value)}
            placeholder={keyPlaceholder}
            spellCheck={false}
            className="w-[40%] rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400/60"
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => set(row.id, "value", e.target.value)}
            placeholder={valuePlaceholder}
            spellCheck={false}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400/60"
          />
          <button
            type="button"
            onClick={() => remove(row.id)}
            disabled={rows.length === 1 && !row.key && !row.value}
            aria-label="Remove row"
            className="shrink-0 text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

function statusBadgeClass(s: number): string {
  if (s >= 200 && s < 300) return "bg-emerald-400/10 text-emerald-400 border-emerald-400/30";
  if (s >= 300 && s < 400) return "bg-blue-400/10 text-blue-400 border-blue-400/30";
  if (s >= 400 && s < 500) return "bg-amber-400/10 text-amber-400 border-amber-400/30";
  return "bg-red-400/10 text-red-400 border-red-400/30";
}

function statusTextClass(s: number | null): string {
  if (s === null) return "text-zinc-500";
  if (s >= 200 && s < 300) return "text-emerald-400";
  if (s >= 400) return "text-red-400";
  return "text-zinc-400";
}

const METHOD_COLORS: Record<Method, string> = {
  GET: "text-emerald-400",
  POST: "text-amber-400",
  PUT: "text-blue-400",
  PATCH: "text-purple-400",
  DELETE: "text-red-400",
  HEAD: "text-zinc-400",
  OPTIONS: "text-zinc-400",
};

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}

function tryParseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function prettyBody(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export function HttpClient() {
  const [method, setMethod] = useState<Method>("GET");
  const [url, setUrl] = useState("https://httpbin.org/get");
  const [reqTab, setReqTab] = useState<RequestTab>("params");
  const [params, setParams] = useState<KVRow[]>([mkRow()]);
  const [reqHeaders, setReqHeaders] = useState<KVRow[]>([mkRow()]);
  const [bodyType, setBodyType] = useState<BodyType>("JSON");
  const [bodyJson, setBodyJson] = useState('{\n  \n}');
  const [bodyRaw, setBodyRaw] = useState("");
  const [bodyForm, setBodyForm] = useState<KVRow[]>([mkRow()]);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [error, setError] = useState("");
  const [resTab, setResTab] = useState<ResponseTab>("body");
  const [pretty, setPretty] = useState(true);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const showBody = BODY_METHODS.has(method);
  const activeParams = params.filter((p) => p.enabled && p.key);
  const activeHeaders = reqHeaders.filter((h) => h.enabled && h.key);

  function handleMethodChange(m: Method) {
    setMethod(m);
    if (!BODY_METHODS.has(m) && reqTab === "body") setReqTab("params");
  }

  function buildFinalUrl(): string {
    if (!activeParams.length) return url;
    const base = url.split("?")[0];
    const sp = new URLSearchParams(activeParams.map((p) => [p.key, p.value]));
    return `${base}?${sp.toString()}`;
  }

  function buildBody(): { body: BodyInit | null; contentType: string | null } {
    if (!showBody) return { body: null, contentType: null };
    if (bodyType === "JSON") return { body: bodyJson, contentType: "application/json" };
    if (bodyType === "Raw") return { body: bodyRaw, contentType: "text/plain" };
    const sp = new URLSearchParams(
      bodyForm.filter((r) => r.enabled && r.key).map((r) => [r.key, r.value])
    );
    return { body: sp.toString(), contentType: "application/x-www-form-urlencoded" };
  }

  async function send() {
    const finalUrl = buildFinalUrl();
    if (!finalUrl.trim()) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError("");
    setResponse(null);

    const { body, contentType } = buildBody();
    const headers: Record<string, string> = {};
    for (const h of activeHeaders) headers[h.key] = h.value;
    if (contentType && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = contentType;
    }

    const t0 = performance.now();
    try {
      const res = await fetch(finalUrl, {
        method,
        headers,
        body: method === "HEAD" ? undefined : body,
        signal: ctrl.signal,
      });
      const ms = Math.round(performance.now() - t0);
      const text = await res.text();
      const size = new TextEncoder().encode(text).length;
      const resHeaders: [string, string][] = [];
      res.headers.forEach((v, k) => resHeaders.push([k, v]));
      setResponse({ status: res.status, statusText: res.statusText, headers: resHeaders, body: text, ms, size });
      setResTab("body");
      setHistory((prev) =>
        [{ method, url, status: res.status, ts: Date.now() }, ...prev.filter((h) => !(h.url === url && h.method === method))].slice(0, 8)
      );
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(
        msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("networkerror")
          ? `Network error — ${msg}. The server may not allow cross-origin requests (CORS).`
          : msg
      );
      setHistory((prev) =>
        [{ method, url, status: null, ts: Date.now() }, ...prev].slice(0, 8)
      );
    } finally {
      setLoading(false);
    }
  }

  function copyResponse() {
    if (!response) return;
    navigator.clipboard.writeText(response.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const reqTabs: RequestTab[] = showBody ? ["params", "headers", "body"] : ["params", "headers"];
  const parsedJson = response ? tryParseJson(response.body) : null;
  const isJson = parsedJson !== null;
  const displayBody = response ? (pretty ? prettyBody(response.body) : response.body) : "";

  return (
    <div className="w-full max-w-3xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">HTTP Client</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Send HTTP requests and inspect responses in the browser.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl">

        {/* URL bar */}
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => handleMethodChange(e.target.value as Method)}
            className={`shrink-0 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-bold outline-none focus:border-amber-400/60 ${METHOD_COLORS[method]}`}
          >
            {METHODS.map((m) => (
              <option key={m} value={m} className="font-normal text-zinc-100">{m}</option>
            ))}
          </select>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="https://api.example.com/endpoint"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-400/60"
          />
          <button
            type="button"
            onClick={loading ? () => abortRef.current?.abort() : send}
            disabled={!url.trim()}
            className={`shrink-0 rounded-xl px-5 py-2 text-sm font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
              loading
                ? "border border-zinc-700 text-zinc-400 hover:border-red-500/50 hover:text-red-400"
                : "bg-amber-400 text-zinc-900 hover:bg-amber-300"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
                Cancel
              </span>
            ) : "Send"}
          </button>
        </div>

        {/* Request tabs */}
        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1 w-fit flex-wrap">
          {reqTabs.map((tab) => {
            const count = tab === "params" ? activeParams.length : tab === "headers" ? activeHeaders.length : 0;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setReqTab(tab)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  reqTab === tab ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab}
                {count > 0 && (
                  <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-xs text-amber-400">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab panels */}
        <div className="min-h-[80px]">
          {reqTab === "params" && (
            <KVEditor rows={params} onChange={setParams} keyPlaceholder="param" valuePlaceholder="value" />
          )}
          {reqTab === "headers" && (
            <KVEditor rows={reqHeaders} onChange={setReqHeaders} keyPlaceholder="Header-Name" valuePlaceholder="value" />
          )}
          {reqTab === "body" && showBody && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 w-fit">
                {BODY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBodyType(t)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      bodyType === t ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {bodyType === "JSON" && (
                <textarea
                  value={bodyJson}
                  onChange={(e) => setBodyJson(e.target.value)}
                  spellCheck={false}
                  rows={6}
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/60"
                />
              )}
              {bodyType === "Raw" && (
                <textarea
                  value={bodyRaw}
                  onChange={(e) => setBodyRaw(e.target.value)}
                  spellCheck={false}
                  rows={6}
                  className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 outline-none focus:border-amber-400/60"
                />
              )}
              {bodyType === "Form" && (
                <KVEditor rows={bodyForm} onChange={setBodyForm} keyPlaceholder="field" valuePlaceholder="value" />
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(response.status)}`}>
                {response.status} {response.statusText}
              </span>
              <span className="text-xs text-zinc-500">{response.ms} ms</span>
              <span className="text-xs text-zinc-500">{fmtSize(response.size)}</span>
              <div className="ml-auto flex gap-1">
                <button
                  type="button"
                  onClick={() => setPretty((v) => !v)}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    pretty ? "border-amber-400/40 text-amber-400" : "border-zinc-700 text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {isJson ? "Tree" : "Pretty"}
                </button>
                <button
                  type="button"
                  onClick={copyResponse}
                  className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1 w-fit">
              {(["body", "headers"] as ResponseTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setResTab(t)}
                  className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    resTab === t ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t}
                  {t === "headers" && <span className="text-zinc-600">({response.headers.length})</span>}
                </button>
              ))}
            </div>

            {resTab === "body" && (
              <div className="max-h-96 overflow-auto rounded-lg bg-zinc-900 p-3">
                {response.body === "" ? (
                  <span className="font-mono text-xs text-zinc-600">(empty body)</span>
                ) : isJson && pretty ? (
                  <JsonTree value={parsedJson} />
                ) : (
                  <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap break-all">{displayBody}</pre>
                )}
              </div>
            )}
            {resTab === "headers" && (
              <div className="flex max-h-64 flex-col gap-1 overflow-auto">
                {response.headers.map(([k, v]) => (
                  <div key={k} className="flex gap-3 rounded-lg border border-zinc-800 px-3 py-1.5">
                    <span className="shrink-0 font-mono text-xs text-amber-400">{k}</span>
                    <span className="min-w-0 break-all font-mono text-xs text-zinc-300">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">History</span>
            <div className="flex flex-col gap-1">
              {history.map((h) => (
                <button
                  key={`${h.method}-${h.url}-${h.ts}`}
                  type="button"
                  onClick={() => { handleMethodChange(h.method); setUrl(h.url); }}
                  className="flex items-center gap-3 rounded-lg border border-zinc-800 px-3 py-2 text-left transition-colors hover:bg-zinc-800/50"
                >
                  <span className={`shrink-0 text-xs font-bold ${METHOD_COLORS[h.method]}`}>{h.method}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-400">{h.url}</span>
                  {h.status !== null && (
                    <span className={`shrink-0 text-xs font-semibold ${statusTextClass(h.status)}`}>{h.status}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Requests are made from your browser — CORS restrictions apply.
      </p>
    </div>
  );
}
