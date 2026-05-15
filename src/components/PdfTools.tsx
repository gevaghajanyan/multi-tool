"use client";

import { useState } from "react";
import { PdfInspector } from "./PdfInspector";
import { PdfJoiner } from "./PdfJoiner";
import { PdfSplitter } from "./PdfSplitter";

type Tab = "inspector" | "joiner" | "splitter";

const TABS: { id: Tab; label: string; description: string }[] = [
  { id: "inspector", label: "Inspector", description: "View metadata & page info" },
  { id: "joiner",   label: "Joiner",    description: "Merge multiple PDFs into one" },
  { id: "splitter", label: "Splitter",  description: "Extract or split pages" },
];

export function PdfTools() {
  const [tab, setTab] = useState<Tab>("joiner");

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">PDF Tools</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Inspect, merge, and split PDF files — everything runs locally.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              tab === t.id
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {tab === "inspector" && <PdfInspector />}
        {tab === "joiner"    && <PdfJoiner />}
        {tab === "splitter"  && <PdfSplitter />}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
