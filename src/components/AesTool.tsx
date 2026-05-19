"use client";

import { useState } from "react";

type Tab = "Encrypt" | "Decrypt";

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptText(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16) as Uint8Array<ArrayBuffer>);
  const iv = crypto.getRandomValues(new Uint8Array(12) as Uint8Array<ArrayBuffer>);
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));
  const combined = new Uint8Array(salt.length + iv.length + cipherBuf.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(cipherBuf), 28);
  return btoa(String.fromCharCode(...combined));
}

async function decryptText(b64: string, password: string): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  if (bytes.length < 28) throw new Error("Wrong password or corrupted data");
  const salt = bytes.slice(0, 16) as Uint8Array<ArrayBuffer>;
  const iv = bytes.slice(16, 28) as Uint8Array<ArrayBuffer>;
  const ciphertext = bytes.slice(28);
  const key = await deriveKey(password, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

export function AesTool() {
  const [tab, setTab] = useState<Tab>("Encrypt");
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleProcess() {
    setError("");
    setOutput("");
    try {
      if (tab === "Encrypt") {
        setOutput(await encryptText(input, password));
      } else {
        setOutput(await decryptText(input.trim(), password));
      }
    } catch {
      setError("Wrong password or corrupted data");
    }
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const tabs: Tab[] = ["Encrypt", "Decrypt"];
  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">AES Encrypt / Decrypt</h1>
        <p className="mt-2 text-sm text-zinc-400">AES-GCM 256-bit encryption with PBKDF2 key derivation.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setOutput(""); setError(""); setInput(""); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? "bg-amber-400 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">
            {tab === "Encrypt" ? "Plaintext" : "Base64 Ciphertext"}
          </span>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
            placeholder={tab === "Encrypt" ? "Enter text to encrypt…" : "Paste base64 ciphertext…"}
            spellCheck={false}
            className="h-36 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setOutput(""); setError(""); }}
            placeholder="Enter password…"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        <button
          type="button"
          onClick={handleProcess}
          disabled={!input.trim() || !password}
          className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {tab}
        </button>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {output && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">
                {tab === "Encrypt" ? "Ciphertext (Base64)" : "Decrypted Text"}
              </span>
              <button type="button" onClick={handleCopy} className={btnCls}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              className="h-36 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100 outline-none"
            />
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">All processing runs locally — your data never leaves this tab.</p>
    </div>
  );
}
