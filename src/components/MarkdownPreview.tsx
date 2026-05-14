"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";

const SAMPLE = `# Hello Markdown

A **quick** demo with _italic_, \`inline code\`, and a [link](https://example.com).

## List

- Item one
- Item two
  - Nested item

## Code block

\`\`\`js
const greet = (name) => \`Hello, \${name}!\`;
\`\`\`

> Blockquote text here.
`;

export function MarkdownPreview() {
  const [source, setSource] = useState(SAMPLE);
  const [view, setView] = useState<"split" | "preview" | "source">("split");
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => marked.parse(source) as string, [source]);

  async function handleCopy() {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const btnCls =
    "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Markdown Preview</h1>
        <p className="mt-2 text-sm text-zinc-400">Write Markdown and see the rendered output live.</p>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            {(["split", "source", "preview"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  view === v ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleCopy} className={btnCls}>
            {copied ? "Copied HTML!" : "Copy HTML"}
          </button>
        </div>

        <div className={`grid gap-4 ${view === "split" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
          {(view === "split" || view === "source") && (
            <div className="flex flex-col gap-1.5">
              {view === "split" && <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">Source</span>}
              <textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                spellCheck={false}
                className="h-[480px] w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950 p-4 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
              />
            </div>
          )}

          {(view === "split" || view === "preview") && (
            <div className="flex flex-col gap-1.5">
              {view === "split" && <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">Preview</span>}
              <div
                className="markdown-body h-[480px] overflow-auto rounded-xl border border-zinc-700 bg-zinc-950 p-4"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .markdown-body { color: #d4d4d8; line-height: 1.7; }
        .markdown-body h1,.markdown-body h2,.markdown-body h3,.markdown-body h4 { color: #f4f4f5; font-weight: 700; margin: 1em 0 0.4em; }
        .markdown-body h1 { font-size: 1.6em; } .markdown-body h2 { font-size: 1.3em; } .markdown-body h3 { font-size: 1.1em; }
        .markdown-body p { margin: 0.6em 0; }
        .markdown-body a { color: #fbbf24; text-decoration: underline; }
        .markdown-body code { background: #27272a; border-radius: 4px; padding: 0.15em 0.4em; font-family: monospace; font-size: 0.85em; color: #a3e635; }
        .markdown-body pre { background: #18181b; border: 1px solid #3f3f46; border-radius: 8px; padding: 1em; overflow-x: auto; margin: 0.8em 0; }
        .markdown-body pre code { background: none; padding: 0; color: #d4d4d8; }
        .markdown-body ul,.markdown-body ol { padding-left: 1.4em; margin: 0.4em 0; }
        .markdown-body li { margin: 0.2em 0; }
        .markdown-body blockquote { border-left: 3px solid #fbbf24; margin: 0.8em 0; padding: 0.2em 1em; color: #a1a1aa; }
        .markdown-body hr { border: none; border-top: 1px solid #3f3f46; margin: 1em 0; }
        .markdown-body table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
        .markdown-body th,.markdown-body td { border: 1px solid #3f3f46; padding: 0.4em 0.8em; }
        .markdown-body th { background: #27272a; }
      `}</style>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
