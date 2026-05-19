"use client";

import { useState } from "react";

function computeStats(text: string) {
  const words = text.trim() === "" ? [] : text.trim().split(/\s+/);
  const wordCount = words.length;
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text.trim() === "" ? 0 : (text.match(/[^.!?]*[.!?]+/g) ?? []).length || (text.trim() !== "" ? 1 : 0);
  const lines = text === "" ? 0 : text.split("\n").length;
  const paragraphs = text.trim() === "" ? 0 : text.split(/\n\s*\n/).filter((p) => p.trim() !== "").length || (text.trim() !== "" ? 1 : 0);
  const readingMins = Math.round(wordCount / 200);
  const readingTime = wordCount === 0 ? "—" : readingMins < 1 ? "< 1 min" : `~${readingMins} min`;

  const stopWords = new Set(["the", "and", "for", "that", "this", "with", "from", "are", "was", "you", "have", "has", "not", "but"]);
  const wordFreq: Record<string, number> = {};
  for (const w of words) {
    const clean = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.length >= 3 && !stopWords.has(clean)) {
      wordFreq[clean] = (wordFreq[clean] ?? 0) + 1;
    }
  }
  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return { wordCount, charCount, charNoSpaces, sentences, lines, paragraphs, readingTime, topWords };
}

export function TextStatsTool() {
  const [text, setText] = useState("");
  const stats = computeStats(text);

  const statCards = [
    { label: "Words", value: stats.wordCount },
    { label: "Characters", value: stats.charCount },
    { label: "Chars (no spaces)", value: stats.charNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Lines", value: stats.lines },
    { label: "Reading time", value: stats.readingTime },
  ];

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Text Statistics</h1>
        <p className="mt-2 text-sm text-zinc-400">Paste or type text to see live word and character stats.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Start typing or paste your text here…"
          spellCheck={false}
          className="h-36 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statCards.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              <span className="text-xs text-zinc-500">{label}</span>
              <span className="text-xl font-bold text-amber-400">{value}</span>
            </div>
          ))}
        </div>

        {stats.topWords.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-300">Top Words</span>
            <div className="flex flex-wrap gap-2">
              {stats.topWords.map(([word, count]) => (
                <span
                  key={word}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300"
                >
                  {word} <span className="text-amber-400">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
