"use client";

import { useRef, useState } from "react";

type Mode = "text" | "file";
type Direction = "encode" | "decode";

function encodeText(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}

function decodeText(s: string): string {
  try {
    return decodeURIComponent(escape(atob(s.trim().replace(/\s/g, ""))));
  } catch {
    throw new Error("Invalid Base64 string");
  }
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function Base64Tool() {
  const [mode, setMode] = useState<Mode>("text");
  const [direction, setDirection] = useState<Direction>("encode");

  // Text mode
  const [textInput, setTextInput] = useState("");
  const [textOutput, setTextOutput] = useState("");
  const [textError, setTextError] = useState("");
  const [copied, setCopied] = useState(false);

  // File encode
  const [encodeOutput, setEncodeOutput] = useState("");
  const [encodeFileName, setEncodeFileName] = useState("");
  const [encodeCopied, setEncodeCopied] = useState(false);

  // File decode
  const [decodeInput, setDecodeInput] = useState("");
  const [decodeFileName, setDecodeFileName] = useState("output.bin");
  const [decodeError, setDecodeError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  function handleTextConvert() {
    try {
      setTextOutput(direction === "encode" ? encodeText(textInput) : decodeText(textInput));
      setTextError("");
    } catch (e) {
      setTextError(e instanceof Error ? e.message : String(e));
      setTextOutput("");
    }
  }

  function handleFileEncode(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEncodeFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const bytes = new Uint8Array(ev.target?.result as ArrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      setEncodeOutput(btoa(binary));
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  function handleFileDecode() {
    try {
      const clean = decodeInput.trim().replace(/\s/g, "");
      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      downloadBlob(new Blob([bytes]), decodeFileName || "output.bin");
      setDecodeError("");
    } catch {
      setDecodeError("Invalid Base64 string");
    }
  }

  async function copy(text: string, setCopiedFn: (v: boolean) => void) {
    await navigator.clipboard.writeText(text);
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 1500);
  }

  const btnClass =
    "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Base64</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Encode and decode Base64 text and files — entirely in your browser.
        </p>
      </header>

      <div className="mb-6 flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
        {(["text", "file"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
              mode === m ? "bg-amber-400 text-zinc-900" : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {m === "text" ? "Text" : "File"}
          </button>
        ))}
      </div>

      {mode === "text" ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            {(["encode", "decode"] as Direction[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDirection(d); setTextOutput(""); setTextError(""); }}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors duration-150 ${
                  direction === d ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-300">
              {direction === "encode" ? "Plain text" : "Base64 string"}
            </span>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={direction === "encode" ? "Enter text to encode…" : "Paste Base64 to decode…"}
              spellCheck={false}
              className="h-36 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60"
            />
            {textError && <p className="font-mono text-xs text-red-400">{textError}</p>}
          </div>

          <button
            type="button"
            onClick={handleTextConvert}
            disabled={!textInput.trim()}
            className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold capitalize text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {direction}
          </button>

          {textOutput && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-300">
                  {direction === "encode" ? "Base64 string" : "Plain text"}
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => copy(textOutput, setCopied)} className={btnClass}>
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadBlob(
                        new Blob([textOutput], { type: "text/plain" }),
                        direction === "encode" ? "encoded.txt" : "decoded.txt",
                      )
                    }
                    className={btnClass}
                  >
                    Download
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={textOutput}
                className="h-36 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100 outline-none"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          {/* Encode */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-zinc-300">File → Base64</span>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileEncode} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="self-start rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors duration-150 hover:border-zinc-600 hover:text-zinc-100"
            >
              Upload file
            </button>
            {encodeOutput && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-zinc-500">{encodeFileName}</span>
                  <button type="button" onClick={() => copy(encodeOutput, setEncodeCopied)} className={btnClass}>
                    {encodeCopied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={encodeOutput}
                  className="h-32 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-100 outline-none"
                />
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800" />

          {/* Decode */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-medium text-zinc-300">Base64 → File</span>
            <textarea
              value={decodeInput}
              onChange={(e) => { setDecodeInput(e.target.value); setDecodeError(""); }}
              placeholder="Paste Base64 string…"
              spellCheck={false}
              className="h-28 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60"
            />
            {decodeError && <p className="font-mono text-xs text-red-400">{decodeError}</p>}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={decodeFileName}
                onChange={(e) => setDecodeFileName(e.target.value)}
                placeholder="filename.bin"
                className="w-44 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60"
              />
              <button
                type="button"
                onClick={handleFileDecode}
                disabled={!decodeInput.trim()}
                className="rounded-xl bg-amber-400 px-4 py-1.5 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Download file
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
