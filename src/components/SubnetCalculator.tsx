"use client";

import { useState } from "react";

interface SubnetInfo {
  network: string;
  broadcast: string;
  subnetMask: string;
  wildcardMask: string;
  firstHost: string;
  lastHost: string;
  usableHosts: number;
  ipClass: string;
}

function ipToNum(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) | parseInt(octet, 10), 0) >>> 0;
}

function numToIp(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join(".");
}

function getIpClass(firstOctet: number): string {
  if (firstOctet < 128) return "A";
  if (firstOctet < 192) return "B";
  if (firstOctet < 224) return "C";
  if (firstOctet < 240) return "D";
  return "E";
}

function calculateSubnet(cidr: string): SubnetInfo {
  const [ipPart, prefixPart] = cidr.split("/");
  const prefix = parseInt(prefixPart, 10);

  const parts = ipPart.split(".");
  if (parts.length !== 4 || parts.some((p) => isNaN(parseInt(p, 10)) || parseInt(p, 10) < 0 || parseInt(p, 10) > 255)) {
    throw new Error("Invalid IP address");
  }
  if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    throw new Error("Prefix must be 0–32");
  }

  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const ipNum = ipToNum(ipPart);
  const networkNum = (ipNum & mask) >>> 0;
  const broadcastNum = (networkNum | (~mask >>> 0)) >>> 0;

  let firstHost: string;
  let lastHost: string;
  let usableHosts: number;

  if (prefix === 32) {
    firstHost = numToIp(networkNum);
    lastHost = numToIp(networkNum);
    usableHosts = 1;
  } else if (prefix === 31) {
    firstHost = numToIp(networkNum);
    lastHost = numToIp(broadcastNum);
    usableHosts = 2;
  } else {
    firstHost = numToIp(networkNum + 1);
    lastHost = numToIp(broadcastNum - 1);
    usableHosts = Math.pow(2, 32 - prefix) - 2;
  }

  const wildcardNum = (~mask) >>> 0;

  return {
    network: numToIp(networkNum),
    broadcast: numToIp(broadcastNum),
    subnetMask: numToIp(mask),
    wildcardMask: numToIp(wildcardNum),
    firstHost,
    lastHost,
    usableHosts,
    ipClass: getIpClass(parseInt(parts[0], 10)),
  };
}

export function SubnetCalculator() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<SubnetInfo | null>(null);
  const [error, setError] = useState("");

  function handleCalculate() {
    setError("");
    setResult(null);
    try {
      if (!input.includes("/")) throw new Error("Enter CIDR notation, e.g. 192.168.1.0/24");
      setResult(calculateSubnet(input.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const resultRows = result
    ? [
        { label: "Network Address", value: result.network },
        { label: "Broadcast", value: result.broadcast },
        { label: "Subnet Mask", value: result.subnetMask },
        { label: "Wildcard Mask", value: result.wildcardMask },
        { label: "First Host", value: result.firstHost },
        { label: "Last Host", value: result.lastHost },
        { label: "Usable Hosts", value: result.usableHosts.toLocaleString() },
        { label: "IP Class", value: `Class ${result.ipClass}` },
      ]
    : [];

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Subnet Calculator</h1>
        <p className="mt-2 text-sm text-zinc-400">Enter a CIDR block to calculate network details.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">CIDR Notation</span>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setResult(null); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
            placeholder="192.168.1.0/24"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        <button
          type="button"
          onClick={handleCalculate}
          disabled={!input.trim()}
          className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Calculate
        </button>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {result && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {resultRows.map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <span className="text-xs text-zinc-500">{label}</span>
                <span className="font-mono text-sm font-semibold text-amber-400">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">All processing runs locally — your data never leaves this tab.</p>
    </div>
  );
}
