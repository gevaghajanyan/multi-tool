"use client";

import { useState } from "react";

const RECORD_TYPES = ["A", "AAAA", "MX", "CNAME", "TXT", "NS", "SOA", "PTR", "CAA"] as const;
type RecordType = typeof RECORD_TYPES[number];

const TYPE_NUMBERS: Record<RecordType, number> = {
  A: 1, AAAA: 28, MX: 15, CNAME: 5, TXT: 16, NS: 2, SOA: 6, PTR: 12, CAA: 257,
};

const RCODE_NAMES: Record<number, string> = {
  0: "NOERROR",
  1: "FORMERR",
  2: "SERVFAIL",
  3: "NXDOMAIN",
  4: "NOTIMP",
  5: "REFUSED",
};

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DnsResponse {
  Status: number;
  Question?: { name: string; type: number }[];
  Answer?: DnsAnswer[];
  Authority?: DnsAnswer[];
}

interface LookupResult {
  type: RecordType;
  response: DnsResponse;
  error?: string;
}

interface HistoryEntry {
  domain: string;
  type: RecordType;
  timestamp: number;
}

function typeNumberToName(n: number): string {
  return Object.entries(TYPE_NUMBERS).find(([, v]) => v === n)?.[0] ?? String(n);
}

function rcodeBadge(status: number) {
  const name = RCODE_NAMES[status] ?? `RCODE${status}`;
  const isOk = status === 0;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isOk ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30" : "bg-red-400/10 text-red-400 border border-red-400/30"
      }`}
    >
      {name}
    </span>
  );
}

async function queryDns(domain: string, type: RecordType): Promise<DnsResponse> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`;
  const res = await fetch(url, { headers: { Accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<DnsResponse>;
}

export function DnsLookup() {
  const [domain, setDomain] = useState("");
  const [activeType, setActiveType] = useState<RecordType>("A");
  const [results, setResults] = useState<LookupResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  function addHistory(d: string, t: RecordType) {
    setHistory((prev) => {
      const next = [{ domain: d, type: t, timestamp: Date.now() }, ...prev.filter((h) => !(h.domain === d && h.type === t))].slice(0, 5);
      return next;
    });
  }

  async function lookup(overrideDomain?: string, overrideType?: RecordType) {
    const d = (overrideDomain ?? domain).trim();
    const t = overrideType ?? activeType;
    if (!d) return;
    setLoading(true);
    setResults([]);
    addHistory(d, t);
    try {
      const response = await queryDns(d, t);
      setResults([{ type: t, response }]);
    } catch (e) {
      setResults([{ type: t, response: { Status: -1 }, error: e instanceof Error ? e.message : "Request failed" }]);
    } finally {
      setLoading(false);
    }
  }

  async function lookupAll() {
    const d = domain.trim();
    if (!d) return;
    setLoading(true);
    setResults([]);
    const settled = await Promise.allSettled(
      RECORD_TYPES.map((t) => queryDns(d, t).then((r) => ({ type: t, response: r } as LookupResult)).catch((e) => ({ type: t, response: { Status: -1 }, error: e instanceof Error ? e.message : "Failed" }) as LookupResult))
    );
    const all = settled.map((s) => (s.status === "fulfilled" ? s.value : { type: "A" as RecordType, response: { Status: -1 }, error: "Failed" }));
    setResults(all);
    addHistory(d, activeType);
    setLoading(false);
  }

  const answers = results.flatMap((r) =>
    r.error
      ? [{ name: "", type: r.type, ttl: "", value: `Error: ${r.error}`, isError: true }]
      : (r.response.Answer ?? r.response.Authority ?? []).map((a) => ({
          name: a.name,
          type: typeNumberToName(a.type),
          ttl: String(a.TTL),
          value: a.data,
          isError: false,
        }))
  );

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">DNS Lookup</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Query DNS records for any domain via Cloudflare DNS-over-HTTPS.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Domain</span>
          <div className="flex gap-2">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="example.com"
              spellCheck={false}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
            />
            <button
              type="button"
              onClick={() => lookup()}
              disabled={loading || !domain.trim()}
              className="shrink-0 self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-900" />
                  Querying
                </span>
              ) : "Lookup"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1 flex-wrap">
            {RECORD_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveType(t)}
                className={activeType === t
                  ? "rounded-lg px-3 py-1.5 text-sm font-medium bg-zinc-700 text-zinc-100"
                  : "rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-300"}
              >
                {t}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={lookupAll}
            disabled={loading || !domain.trim()}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Lookup all
          </button>
        </div>

        {results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((r) => (
              <div key={r.type} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{r.type}</span>
                  {!r.error && rcodeBadge(r.response.Status)}
                </div>
                {r.error ? (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-400">Request failed</p>
                      <p className="mt-0.5 font-mono text-xs text-red-400/70">{r.error}</p>
                    </div>
                    {results.length === 1 && (
                      <button
                        type="button"
                        onClick={() => lookup()}
                        className="shrink-0 rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ) : (r.response.Answer ?? r.response.Authority ?? []).length === 0 && r.response.Status === 0 ? (
                  <p className="text-xs text-zinc-500 pl-1">No records found.</p>
                ) : (r.response.Answer ?? r.response.Authority ?? []).length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950">
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">TTL</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Name</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(r.response.Answer ?? r.response.Authority ?? []).map((a, i) => (
                          <tr key={i} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30">
                            <td className="px-3 py-2 font-mono text-xs text-zinc-400">{a.TTL}</td>
                            <td className="px-3 py-2 font-mono text-xs text-zinc-300 max-w-[120px] truncate">{a.name}</td>
                            <td className="px-3 py-2 font-mono text-xs text-amber-400">{typeNumberToName(a.type)}</td>
                            <td className="px-3 py-2 font-mono text-xs text-zinc-100 break-all">{a.data}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-300">Recent lookups</span>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <button
                  key={`${h.domain}-${h.type}-${h.timestamp}`}
                  type="button"
                  onClick={() => { setDomain(h.domain); setActiveType(h.type); lookup(h.domain, h.type); }}
                  className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                >
                  {h.domain} <span className="text-amber-400">{h.type}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Queries sent to Cloudflare DNS (1.1.1.1) — no data stored locally.
      </p>
    </div>
  );
}
