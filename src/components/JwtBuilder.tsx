"use client";

import { useState } from "react";

type Algo = "HS256" | "HS384" | "HS512";

const ALGO_MAP: Record<Algo, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlStr(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function buildJwt(payload: string, secret: string, algo: Algo): Promise<string> {
  const header = JSON.stringify({ alg: algo, typ: "JWT" });
  const headerB64 = b64urlStr(header);

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(payload);
  } catch {
    throw new Error("Payload must be valid JSON");
  }
  const payloadB64 = b64urlStr(JSON.stringify(parsedPayload));

  const data = `${headerB64}.${payloadB64}`;
  const keyBuf = new TextEncoder().encode(secret);
  const dataBuf = new TextEncoder().encode(data);

  const key = await crypto.subtle.importKey(
    "raw",
    keyBuf,
    { name: "HMAC", hash: ALGO_MAP[algo] },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, dataBuf);
  return `${data}.${b64url(sig)}`;
}

const DEFAULT_PAYLOAD = `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": ${Math.floor(Date.now() / 1000)}
}`;

export function JwtBuilder() {
  const [algo, setAlgo] = useState<Algo>("HS256");
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleBuild() {
    setError("");
    setToken("");
    try {
      const jwt = await buildJwt(payload, secret, algo);
      setToken(jwt);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const btnCls =
    "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  const parts = token.split(".");
  const colorClass = (i: number) =>
    i === 0 ? "text-red-400" : i === 1 ? "text-amber-400" : "text-sky-400";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">JWT Builder</h1>
        <p className="mt-2 text-sm text-zinc-400">Sign a JSON payload and build a JWT token.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Algorithm */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Algorithm</span>
          <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1 w-fit">
            {(["HS256", "HS384", "HS512"] as Algo[]).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAlgo(a)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  algo === a ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Payload */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Payload (JSON)</span>
          <textarea
            value={payload}
            onChange={(e) => { setPayload(e.target.value); setToken(""); setError(""); }}
            spellCheck={false}
            className="h-40 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        {/* Secret */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Secret</span>
          <input
            type="text"
            value={secret}
            onChange={(e) => { setSecret(e.target.value); setToken(""); setError(""); }}
            spellCheck={false}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        <button
          type="button"
          onClick={handleBuild}
          className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300"
        >
          Build JWT
        </button>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {token && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Token</span>
              <button type="button" onClick={handleCopy} className={btnCls}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="break-all rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm leading-relaxed">
              {parts.map((part, i) => (
                <span key={i}>
                  <span className={colorClass(i)}>{part}</span>
                  {i < parts.length - 1 && <span className="text-zinc-600">.</span>}
                </span>
              ))}
            </div>
            <div className="flex gap-4 text-xs">
              <span className="text-red-400">■ Header</span>
              <span className="text-amber-400">■ Payload</span>
              <span className="text-sky-400">■ Signature</span>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
