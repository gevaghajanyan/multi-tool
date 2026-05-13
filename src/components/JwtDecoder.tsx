"use client";

import { useState } from "react";
import { JsonTree } from "./JsonTree";

function base64urlDecode(s: string): string {
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

interface Decoded {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

function decodeJwt(token: string): Decoded {
  const parts = token.trim().split(".");
  if (parts.length !== 3) throw new Error("JWT must have exactly 3 parts separated by dots");
  const header = JSON.parse(base64urlDecode(parts[0]));
  const payload = JSON.parse(base64urlDecode(parts[1]));
  return { header, payload, signature: parts[2] };
}

function ExpiryBadge({ exp }: { exp: unknown }) {
  if (typeof exp !== "number") return null;
  const now = Math.floor(Date.now() / 1000);
  const expired = now > exp;
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${
        expired ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${expired ? "bg-red-400" : "bg-green-400"}`} />
      {expired ? "Expired" : "Valid"} · expires {new Date(exp * 1000).toLocaleString()}
    </div>
  );
}

function Section({ label, badge, children }: { label: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        {badge}
      </div>
      <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-3">
        {children}
      </div>
    </div>
  );
}

export function JwtDecoder() {
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState<Decoded | null>(null);
  const [error, setError] = useState("");

  function handleChange(value: string) {
    setToken(value);
    if (!value.trim()) {
      setDecoded(null);
      setError("");
      return;
    }
    // Only attempt decode once all three parts are present
    if (value.trim().split(".").length === 3) {
      try {
        setDecoded(decodeJwt(value));
        setError("");
      } catch (e) {
        setDecoded(null);
        setError(e instanceof Error ? e.message : String(e));
      }
    } else {
      setDecoded(null);
      setError("");
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">JWT Decoder</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Inspect JSON Web Token headers, payloads, and expiry.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Token</span>
          <textarea
            value={token}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Paste your JWT here…"
            spellCheck={false}
            className="h-28 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60"
          />
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
        </div>

        {decoded && (
          <>
            {decoded.payload.exp !== undefined && (
              <ExpiryBadge exp={decoded.payload.exp} />
            )}

            <Section
              label="Header"
              badge={
                typeof decoded.header.alg === "string" ? (
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                    {decoded.header.alg}
                  </span>
                ) : undefined
              }
            >
              <JsonTree value={decoded.header} />
            </Section>

            <Section label="Payload">
              <JsonTree value={decoded.payload} />
            </Section>

            <Section label="Signature">
              <p className="break-all font-mono text-xs text-zinc-500">{decoded.signature}</p>
            </Section>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Tokens are decoded locally — nothing is sent to any server.
      </p>
    </div>
  );
}
