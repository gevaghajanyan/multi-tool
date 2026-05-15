"use client";

import { useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(2)} MB`;
}

function parseRange(str: string, max: number): Set<number> {
  const result = new Set<number>();
  for (const part of str.split(",")) {
    const m = part.trim().match(/^(\d+)(?:-(\d+))?$/);
    if (!m) continue;
    const start = Math.max(0, parseInt(m[1]) - 1);
    const end = Math.min(max - 1, m[2] ? parseInt(m[2]) - 1 : start);
    for (let i = start; i <= end; i++) result.add(i);
  }
  return result;
}

function selectionToRange(sel: Set<number>): string {
  if (sel.size === 0) return "";
  const sorted = [...sel].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) { end = sorted[i]; }
    else { parts.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`); start = end = sorted[i]; }
  }
  parts.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
  return parts.join(", ");
}

export function PdfSplitter() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [rangeInput, setRangeInput] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const [dropHover, setDropHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  async function loadFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".pdf") && f.type !== "application/pdf") return;
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const n = doc.getPageCount();
      setFile(f); fileRef.current = f;
      setPageCount(n);
      const all = new Set<number>(Array.from({ length: n }, (_, i) => i));
      setSelected(all);
      setRangeInput(selectionToRange(all));
      setRangeError("");
    } catch {
      setRangeError("Could not read PDF.");
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDropHover(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }

  function togglePage(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      setRangeInput(selectionToRange(next));
      return next;
    });
  }

  function applyQuick(mode: "all" | "none" | "odd" | "even") {
    const next = new Set<number>();
    if (mode === "all") for (let i = 0; i < pageCount; i++) next.add(i);
    else if (mode === "odd") for (let i = 0; i < pageCount; i += 2) next.add(i);
    else if (mode === "even") for (let i = 1; i < pageCount; i += 2) next.add(i);
    setSelected(next);
    setRangeInput(selectionToRange(next));
  }

  function handleRangeInput(val: string) {
    setRangeInput(val);
    const parsed = parseRange(val, pageCount);
    if (val.trim() && parsed.size === 0) { setRangeError("Invalid range"); }
    else { setRangeError(""); setSelected(parsed); }
  }

  async function extract() {
    if (!fileRef.current || selected.size === 0) return;
    setExtracting(true);
    try {
      const bytes = new Uint8Array(await fileRef.current.arrayBuffer());
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const out = await PDFDocument.create();
      const indices = [...selected].sort((a, b) => a - b);
      const pages = await out.copyPages(src, indices);
      pages.forEach((p) => out.addPage(p));
      const data = await out.save();
      const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = fileRef.current.name.replace(/\.pdf$/i, "");
      a.href = url; a.download = `${base}-extracted.pdf`; a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExtracting(false);
    }
  }

  async function splitAll() {
    if (!fileRef.current || pageCount === 0) return;
    setSplitting(true);
    try {
      const bytes = new Uint8Array(await fileRef.current.arrayBuffer());
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const base = fileRef.current.name.replace(/\.pdf$/i, "");
      for (let i = 0; i < pageCount; i++) {
        const out = await PDFDocument.create();
        const [page] = await out.copyPages(src, [i]);
        out.addPage(page);
        const data = await out.save();
        const blob = new Blob([data.buffer as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${base}-page-${i + 1}.pdf`; a.click();
        URL.revokeObjectURL(url);
        // stagger to avoid browser blocking multiple downloads
        await new Promise((r) => setTimeout(r, 80));
      }
    } finally {
      setSplitting(false);
    }
  }

  const dropCls = `flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer select-none py-12 transition-colors ${
    dropHover ? "border-amber-400/60 bg-amber-400/5" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
  }`;
  const btnSm = "rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100";

  return (
    <div className="flex flex-col gap-5">
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="sr-only"
        onChange={(e) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); e.target.value = ""; }} />

      {!file ? (
        <div className={dropCls} onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
          onDragLeave={() => setDropHover(false)} onDrop={onDrop}>
          <svg className="h-9 w-9 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <p className="text-sm text-zinc-400">Drop a PDF here or <span className="text-amber-400">browse</span></p>
          <p className="text-xs text-zinc-600">PDF files only</p>
        </div>
      ) : (
        <>
          {/* File bar */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">{file.name}</p>
              <p className="text-xs text-zinc-500">{fmtBytes(file.size)} · {pageCount} pages</p>
            </div>
            <button type="button" onClick={() => { setFile(null); fileRef.current = null; setPageCount(0); setSelected(new Set()); setRangeInput(""); }}
              className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300">Change</button>
          </div>

          {/* Quick select */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Quick select:</span>
            {(["all", "none", "odd", "even"] as const).map((m) => (
              <button key={m} type="button" onClick={() => applyQuick(m)} className={btnSm}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>
            ))}
          </div>

          {/* Page grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-300">Pages</span>
              <span className="text-xs text-zinc-500">{selected.size} of {pageCount} selected</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-3">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => togglePage(i)}
                  className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-mono font-medium transition-colors ${
                    selected.has(i)
                      ? "bg-amber-400 text-zinc-900 hover:bg-amber-300"
                      : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Range input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Range <span className="text-xs font-normal text-zinc-500">e.g. 1-3, 5, 7-9</span></label>
            <input
              type="text"
              value={rangeInput}
              onChange={(e) => handleRangeInput(e.target.value)}
              placeholder="1-3, 5, 7-9"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
            />
            {rangeError && <p className="font-mono text-xs text-red-400">{rangeError}</p>}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={extract} disabled={selected.size === 0 || extracting}
              className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40">
              {extracting ? "Extracting…" : `Extract ${selected.size} page${selected.size !== 1 ? "s" : ""}`}
            </button>
            <button type="button" onClick={splitAll} disabled={splitting}
              className="rounded-xl border border-zinc-700 px-5 py-2 text-sm font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40">
              {splitting ? `Splitting…` : `Split into ${pageCount} files`}
            </button>
          </div>
        </>
      )}

      {rangeError && !file && <p className="font-mono text-xs text-red-400">{rangeError}</p>}
    </div>
  );
}
