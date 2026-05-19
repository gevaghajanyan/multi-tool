"use client";

import { useState } from "react";

type KeySize = 2048 | 4096;
type KeyUse = "RSA-OAEP" | "RSASSA-PKCS1-v1_5";

function toPem(label: string, buffer: ArrayBuffer): string {
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const lines = b64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

async function generateKeyPair(size: KeySize, use: KeyUse): Promise<{ publicPem: string; privatePem: string }> {
  const isSign = use === "RSASSA-PKCS1-v1_5";
  const keyPair = await crypto.subtle.generateKey(
    {
      name: use,
      modulusLength: size,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    isSign ? ["sign", "verify"] : ["encrypt", "decrypt"],
  );

  const [pubBuf, privBuf] = await Promise.all([
    crypto.subtle.exportKey("spki", keyPair.publicKey),
    crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  ]);

  return {
    publicPem: toPem("PUBLIC KEY", pubBuf),
    privatePem: toPem("PRIVATE KEY", privBuf),
  };
}

export function RsaKeyPair() {
  const [keySize, setKeySize] = useState<KeySize>(2048);
  const [keyUse, setKeyUse] = useState<KeyUse>("RSA-OAEP");
  const [keys, setKeys] = useState<{ publicPem: string; privatePem: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setKeys(null);
    try {
      const result = await generateKeyPair(keySize, keyUse);
      setKeys(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">RSA Key Pair</h1>
        <p className="mt-2 text-sm text-zinc-400">Generate RSA public/private key pairs in PEM format.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Key size</span>
            <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
              {([2048, 4096] as KeySize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setKeySize(s)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    keySize === s ? "bg-amber-400 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Key use</span>
            <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
              {(["RSA-OAEP", "RSASSA-PKCS1-v1_5"] as KeyUse[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setKeyUse(u)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    keyUse === u ? "bg-amber-400 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {u === "RSA-OAEP" ? "Encryption" : "Signing"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Generating…" : "Generate Key Pair"}
        </button>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {keys && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Public Key", pem: keys.publicPem, key: "public" },
              { label: "Private Key", pem: keys.privatePem, key: "private" },
            ].map(({ label, pem, key }) => (
              <div key={key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">{label}</span>
                  <button type="button" onClick={() => handleCopy(pem, key)} className={btnCls}>
                    {copied === key ? "Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={pem}
                  className="h-48 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-300 outline-none"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">All processing runs locally — your data never leaves this tab.</p>
    </div>
  );
}
