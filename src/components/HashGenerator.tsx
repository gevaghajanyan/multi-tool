"use client";

import { useRef, useState } from "react";

type Algorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
const ALGOS: Algorithm[] = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];

async function hashBuffer(buf: ArrayBuffer, algo: Algorithm): Promise<string> {
  const digest = await crypto.subtle.digest(algo, buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashText(text: string, algo: Algorithm): Promise<string> {
  const buf = new TextEncoder().encode(text).buffer as ArrayBuffer;
  return hashBuffer(buf, algo);
}

export function HashGenerator() {
  const [input, setInput] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [hashes, setHashes] = useState<Record<Algorithm, string>>({} as Record<Algorithm, string>);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function compute(text: string, buf: ArrayBuffer | null) {
    setLoading(true);
    const result = {} as Record<Algorithm, string>;
    for (const algo of ALGOS) {
      result[algo] = await (buf ? hashBuffer(buf, algo) : hashText(text, algo));
    }
    setHashes(result);
    setLoading(false);
  }

  function handleTextChange(value: string) {
    setInput(value);
    setFileName("");
    setFileBuffer(null);
    if (value) compute(value, null);
    else setHashes({} as Record<Algorithm, string>);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setInput("");
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const buf = ev.target?.result as ArrayBuffer;
      setFileBuffer(buf);
      compute("", buf);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  const hasOutput = Object.keys(hashes).length > 0;
  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Hash Generator</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Generate SHA hashes from text or files.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Input</span>
            <div className="flex gap-2">
              <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
              <button type="button" onClick={() => fileRef.current?.click()} className={btnCls}>
                Upload file
              </button>
              <button
                type="button"
                onClick={() => { setInput(""); setFileName(""); setFileBuffer(null); setHashes({} as Record<Algorithm, string>); }}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Clear
              </button>
            </div>
          </div>

          {fileName ? (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
              <span className="text-sm text-zinc-300 truncate">{fileName}</span>
            </div>
          ) : (
            <textarea
              value={input}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Type or paste text to hash…"
              spellCheck={false}
              className="h-32 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
            />
          )}
        </div>

        {loading && <p className="text-xs text-zinc-500">Computing…</p>}

        {hasOutput && !loading && (
          <div className="flex flex-col gap-3">
            {ALGOS.map((algo) => (
              <div key={algo} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{algo}</span>
                  <button type="button" onClick={() => copy(hashes[algo], algo)} className={btnCls}>
                    {copiedKey === algo ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="break-all rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300">
                  {hashes[algo]}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
