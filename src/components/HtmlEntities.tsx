"use client";

import { useState } from "react";

type Direction = "encode" | "decode";

function encodeEntities(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function decodeEntities(text: string): string {
  const doc = new DOMParser().parseFromString(text, "text/html");
  return doc.documentElement.textContent ?? "";
}

export function HtmlEntities() {
  const [direction, setDirection] = useState<Direction>("encode");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const output = input
    ? direction === "encode"
      ? encodeEntities(input)
      : decodeEntities(input)
    : "";

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const btnCls =
    "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">HTML Entities</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Encode or decode HTML entities in text.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Direction toggle */}
        <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          {(["encode", "decode"] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors duration-150 ${
                direction === d ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">
              {direction === "encode" ? "Plain text" : "HTML with entities"}
            </span>
            <button
              type="button"
              onClick={() => setInput("")}
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Clear
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              direction === "encode"
                ? '<h1>Hello & "world"</h1>'
                : "&lt;h1&gt;Hello &amp; &quot;world&quot;&lt;/h1&gt;"
            }
            spellCheck={false}
            className="h-40 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        {/* Output */}
        {output && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">
                {direction === "encode" ? "Encoded" : "Decoded"}
              </span>
              <button type="button" onClick={handleCopy} className={btnCls}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="max-h-64 w-full overflow-auto whitespace-pre-wrap break-all rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100">
              {output}
            </pre>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
