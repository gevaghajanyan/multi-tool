"use client";

import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import { jsPDF } from "jspdf";

type PageSize = "a4" | "letter";

const EXAMPLE_MARKDOWN = `# My Document

## Introduction

This is a **sample document** with *markdown* formatting.

## Features

- Easy to write
- Renders beautifully
- Export to PDF

## Code Example

\`\`\`javascript
function hello(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Table

| Column A | Column B | Column C |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Value 4  | Value 5  | Value 6  |
`;

const PREVIEW_STYLES = `
  .md-preview { color: #1a1a1a; line-height: 1.7; font-family: Georgia, serif; }
  .md-preview h1, .md-preview h2, .md-preview h3, .md-preview h4 { color: #111; font-weight: 700; margin: 1em 0 0.4em; font-family: Arial, sans-serif; }
  .md-preview h1 { font-size: 2em; } .md-preview h2 { font-size: 1.5em; } .md-preview h3 { font-size: 1.2em; }
  .md-preview p { margin: 0.6em 0; }
  .md-preview a { color: #d97706; }
  .md-preview code { background: #f3f4f6; border-radius: 3px; padding: 0.15em 0.4em; font-family: monospace; font-size: 0.85em; color: #1f2937; }
  .md-preview pre { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1em; overflow-x: auto; margin: 0.8em 0; }
  .md-preview pre code { background: none; padding: 0; }
  .md-preview ul, .md-preview ol { padding-left: 1.4em; margin: 0.4em 0; }
  .md-preview li { margin: 0.2em 0; }
  .md-preview blockquote { border-left: 3px solid #d97706; margin: 0.8em 0; padding: 0.2em 1em; color: #6b7280; }
  .md-preview hr { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
  .md-preview table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
  .md-preview th, .md-preview td { border: 1px solid #e5e7eb; padding: 0.4em 0.8em; }
  .md-preview th { background: #f3f4f6; font-weight: 600; }
  .md-preview strong { font-weight: 700; }
  .md-preview em { font-style: italic; }
`;

export function MarkdownToPdf() {
  const [markdown, setMarkdown] = useState(EXAMPLE_MARKDOWN);
  const [previewHtml, setPreviewHtml] = useState("");
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [fontSize, setFontSize] = useState(14);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const html = await marked.parse(markdown);
      if (!cancelled) setPreviewHtml(html as string);
    })();
    return () => { cancelled = true; };
  }, [markdown]);

  async function downloadPdf() {
    setGenerating(true);
    setError("");
    try {
      const html = await marked.parse(markdown);

      const container = document.createElement("div");
      container.className = "md-preview";
      container.style.cssText = `position:absolute;left:-9999px;width:700px;font-family:Georgia,serif;font-size:${fontSize}px;line-height:1.6;color:#000;background:#fff;padding:40px`;
      container.innerHTML = html as string;

      // inject styles
      const styleEl = document.createElement("style");
      styleEl.textContent = PREVIEW_STYLES;
      container.prepend(styleEl);

      document.body.appendChild(container);

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: pageSize,
      });

      await doc.html(container, {
        callback: (d) => {
          d.save("document.pdf");
        },
        margin: [40, 40, 40, 40],
        autoPaging: "text",
        x: 0,
        y: 0,
        width: pageSize === "a4" ? 515 : 535,
        windowWidth: 700,
      });

      document.body.removeChild(container);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setGenerating(false);
    }
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") setMarkdown(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="w-full max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Markdown → PDF</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Convert Markdown to a downloadable PDF — nothing is uploaded.
        </p>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        className="sr-only"
        onChange={handleUpload}
      />

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Page size toggle */}
          <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            {(["a4", "letter"] as PageSize[]).map((ps) => (
              <button
                key={ps}
                type="button"
                onClick={() => setPageSize(ps)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  pageSize === ps
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {ps === "a4" ? "A4" : "Letter"}
              </button>
            ))}
          </div>

          {/* Font size */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-300">Font</span>
            <input
              type="number"
              min={8}
              max={24}
              value={fontSize}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 8 && v <= 24) setFontSize(v);
              }}
              className="w-16 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
            />
            <span className="text-xs text-zinc-500">px</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Upload .md */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
            >
              Upload .md
            </button>

            {/* Download PDF */}
            <button
              type="button"
              onClick={downloadPdf}
              disabled={generating || !markdown.trim()}
              className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generating ? "Generating…" : "Download PDF"}
            </button>
          </div>
        </div>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {/* Split view */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Markdown textarea */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">Markdown</span>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
              className="h-[480px] w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
              placeholder="Type your Markdown here…"
            />
          </div>

          {/* HTML preview */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">Preview</span>
            <div
              className="md-preview h-[480px] overflow-auto rounded-xl border border-zinc-700 bg-white p-4"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </div>

      <style>{PREVIEW_STYLES}</style>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
