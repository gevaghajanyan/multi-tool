"use client";

import { useEffect, useState, useCallback } from "react";

interface IpData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  org: string;
  asn: string;
  currency: string;
  languages: string;
  country_calling_code: string;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="font-mono text-sm text-zinc-100 text-right ml-4 break-all">{value || "—"}</span>
    </div>
  );
}

export function IpInfo() {
  const [data, setData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customIp, setCustomIp] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupData, setLookupData] = useState<IpData | null>(null);
  const [lookupError, setLookupError] = useState("");

  async function fetchIp(url: string, setResult: (d: IpData) => void, setErr: (e: string) => void, setLoad: (l: boolean) => void) {
    setLoad(true);
    setErr("");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.reason || "Request failed");
      setResult(json as IpData);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to fetch IP info");
    } finally {
      setLoad(false);
    }
  }

  const fetchMyIp = useCallback(() => {
    fetchIp("https://ipapi.co/json/", setData, setError, setLoading);
  }, []);

  useEffect(() => {
    fetchMyIp();
  }, [fetchMyIp]);

  function handleLookup() {
    const ip = customIp.trim();
    if (!ip) return;
    setLookupData(null);
    fetchIp(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, setLookupData, setLookupError, setLookupLoading);
  }

  const displayData = lookupData ?? data;
  const displayLoading = lookupData ? false : loading;

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">IP Info</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Look up geolocation and network details for any IP address.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 uppercase tracking-wide">Your IP</span>
            {loading ? (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
                <span className="text-sm text-zinc-500">Fetching…</span>
              </div>
            ) : error ? (
              <p className="mt-1 font-mono text-xs text-red-400">{error}</p>
            ) : data ? (
              <p className="mt-1 font-mono text-2xl font-bold text-amber-400">{data.ip}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => { setLookupData(null); setLookupError(""); fetchMyIp(); }}
            disabled={loading}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Refresh
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customIp}
            onChange={(e) => setCustomIp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="Look up any IP (e.g. 8.8.8.8)"
            spellCheck={false}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookupLoading || !customIp.trim()}
            className="shrink-0 self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {lookupLoading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-900" />
                Looking up
              </span>
            ) : "Look up"}
          </button>
        </div>

        {lookupError && <p className="font-mono text-xs text-red-400">{lookupError}</p>}

        {lookupData && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2">
            <span className="text-xs text-zinc-400">Showing results for</span>
            <span className="font-mono text-sm font-semibold text-amber-400">{lookupData.ip}</span>
            <button
              type="button"
              onClick={() => { setLookupData(null); setLookupError(""); setCustomIp(""); }}
              className="ml-auto rounded-lg border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:text-zinc-100"
            >
              Clear
            </button>
          </div>
        )}

        {displayLoading && !displayData ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
          </div>
        ) : displayData ? (
          <div className="flex flex-col gap-2">
            <InfoRow label="IP Address" value={displayData.ip} />
            <InfoRow label="City" value={displayData.city} />
            <InfoRow label="Region" value={displayData.region} />
            <InfoRow label="Country" value={displayData.country_name} />
            <InfoRow label="Latitude" value={String(displayData.latitude)} />
            <InfoRow label="Longitude" value={String(displayData.longitude)} />
            <InfoRow label="Timezone" value={displayData.timezone} />
            <InfoRow label="ISP / Org" value={displayData.org} />
            <InfoRow label="ASN" value={displayData.asn} />
            <InfoRow label="Currency" value={displayData.currency} />
            <InfoRow label="Languages" value={displayData.languages} />
            <InfoRow label="Calling code" value={displayData.country_calling_code} />
          </div>
        ) : null}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">Data provided by ipapi.co</p>
    </div>
  );
}
