"use client";

import { useState } from "react";

type Separator = "-" | "_" | ".";
type CaseMode = "lowercase" | "preserve";

function generateSlug(phrase: string, sep: Separator, caseMode: CaseMode, maxLen: number): string {
  let s = phrase.normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/[^a-zA-Z0-9\s]/g, "");
  s = s.trim();
  s = s.replace(/\s+/g, sep);
  s = s.replace(new RegExp(`\\${sep}+`, "g"), sep);
  if (caseMode === "lowercase") s = s.toLowerCase();
  if (maxLen > 0 && s.length > maxLen) {
    s = s.slice(0, maxLen);
    const sepRe = new RegExp(`\\${sep}$`);
    s = s.replace(sepRe, "");
  }
  return s;
}

export function SlugGenerator() {
  const [phrase, setPhrase] = useState("");
  const [sep, setSep] = useState<Separator>("-");
  const [caseMode, setCaseMode] = useState<CaseMode>("lowercase");
  const [maxLen, setMaxLen] = useState(0);
  const [copied, setCopied] = useState(false);

  const slug = generateSlug(phrase, sep, caseMode, maxLen);

  async function handleCopy() {
    if (!slug) return;
    await navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";
  const sepBtns: Separator[] = ["-", "_", "."];
  const caseBtns: CaseMode[] = ["lowercase", "preserve"];

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Slug Generator</h1>
        <p className="mt-2 text-sm text-zinc-400">Turn any phrase into a clean URL-friendly slug.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Phrase</span>
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Hello World! My Blog Post"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Separator</span>
            <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
              {sepBtns.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSep(s)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    sep === s ? "bg-amber-400 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Case</span>
            <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
              {caseBtns.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCaseMode(c)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    caseMode === c ? "bg-amber-400 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {c === "lowercase" ? "lowercase" : "Preserve"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Max length (0 = none)</span>
            <input
              type="number"
              min={0}
              value={maxLen}
              onChange={(e) => setMaxLen(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="w-24 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
            />
          </div>
        </div>

        {slug && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Slug</span>
              <button type="button" onClick={handleCopy} className={btnCls}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3">
              <p className="break-all font-mono text-base text-amber-400">{slug}</p>
              <p className="mt-1 text-xs text-zinc-500">{slug.length} characters</p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">All processing runs locally — your data never leaves this tab.</p>
    </div>
  );
}
