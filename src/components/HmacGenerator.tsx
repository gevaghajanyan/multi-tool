"use client";

import { useState } from "react";

type HashAlgo = "SHA-256" | "SHA-384" | "SHA-512";

async function generateHmac(message: string, secret: string, algo: HashAlgo) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: algo },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const base64 = btoa(String.fromCharCode(...bytes));
  return { hex, base64 };
}

export function HmacGenerator() {
  const [message, setMessage] = useState("");
  const [secret, setSecret] = useState("");
  const [algo, setAlgo] = useState<HashAlgo>("SHA-256");
  const [result, setResult] = useState<{ hex: string; base64: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function handleGenerate() {
    setError("");
    setResult(null);
    try {
      const res = await generateHmac(message, secret, algo);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const algos: HashAlgo[] = ["SHA-256", "SHA-384", "SHA-512"];
  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">HMAC Generator</h1>
        <p className="mt-2 text-sm text-zinc-400">Generate HMAC signatures using a secret key and hash algorithm.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Message</span>
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); setResult(null); }}
            placeholder="Enter message to sign…"
            spellCheck={false}
            className="h-36 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Secret Key</span>
          <input
            type="password"
            value={secret}
            onChange={(e) => { setSecret(e.target.value); setResult(null); }}
            placeholder="Enter secret key…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Algorithm</span>
          <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
            {algos.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => { setAlgo(a); setResult(null); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  algo === a ? "bg-amber-400 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!message || !secret}
          className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Generate HMAC
        </button>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {result && (
          <div className="flex flex-col gap-3">
            {(["hex", "base64"] as const).map((fmt) => (
              <div key={fmt} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{fmt}</span>
                  <button type="button" onClick={() => handleCopy(result[fmt], fmt)} className={btnCls}>
                    {copied === fmt ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="break-all rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300">
                  {result[fmt]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">All processing runs locally — your data never leaves this tab.</p>
    </div>
  );
}
