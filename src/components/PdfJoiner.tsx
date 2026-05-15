"use client";

import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

interface PdfEntry {
  id: string;
  file: File;
  pageCount: number | null;
  error: string | null;
}

interface Result {
  url: string;
  pageCount: number;
  bytes: number;
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(2)} MB`;
}

let idCounter = 0;
function nextId() { return `pdf-${++idCounter}`; }

export function PdfJoiner() {
  const [entries, setEntries] = useState<PdfEntry[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState("");
  const [dropHover, setDropHover] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (result) URL.revokeObjectURL(result.url); };
  }, [result]);

  async function loadFiles(files: File[]) {
    const pdfs = files.filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"));
    if (!pdfs.length) return;
    const newEntries: PdfEntry[] = await Promise.all(
      pdfs.map(async (file) => {
        const id = nextId();
        try {
          const bytes = new Uint8Array(await file.arrayBuffer());
          const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
          return { id, file, pageCount: doc.getPageCount(), error: null };
        } catch {
          return { id, file, pageCount: null, error: "Could not read PDF" };
        }
      }),
    );
    setEntries((prev) => [...prev, ...newEntries]);
    setResult(null); setMergeError("");
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) loadFiles(Array.from(e.target.files));
    e.target.value = "";
  }

  function onZoneDrop(e: React.DragEvent) {
    e.preventDefault(); setDropHover(false);
    loadFiles(Array.from(e.dataTransfer.files));
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setResult(null); setMergeError("");
  }

  function move(id: string, dir: -1 | 1) {
    setEntries((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
    setResult(null);
  }

  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    setEntries((prev) => {
      const arr = [...prev];
      const fromIdx = arr.findIndex((e) => e.id === fromId);
      const toIdx = arr.findIndex((e) => e.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
    setResult(null);
  }

  async function merge() {
    if (entries.length < 2) return;
    setMerging(true); setMergeError("");
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    try {
      const merged = await PDFDocument.create();
      for (const entry of entries) {
        const bytes = new Uint8Array(await entry.file.arrayBuffer());
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const out = await merged.save();
      const blob = new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
      setResult({ url: URL.createObjectURL(blob), pageCount: merged.getPageCount(), bytes: out.byteLength });
    } catch (err) {
      setMergeError(err instanceof Error ? err.message : String(err));
    } finally {
      setMerging(false);
    }
  }

  function download() {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url; a.download = "merged.pdf"; a.click();
  }

  const totalPages = entries.reduce((s, e) => s + (e.pageCount ?? 0), 0);
  const validCount = entries.filter((e) => !e.error).length;
  const canMerge = validCount >= 2 && !merging;

  const dropCls = `flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer select-none py-10 transition-colors ${
    dropHover ? "border-amber-400/60 bg-amber-400/5" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
  }`;
  const btnSm = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex flex-col gap-5">
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" multiple className="sr-only" onChange={handleFileInput} />

      {/* Drop zone */}
      <div className={dropCls} onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
        onDragLeave={() => setDropHover(false)}
        onDrop={onZoneDrop}>
        <svg className="h-9 w-9 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
        </svg>
        <p className="text-sm text-zinc-400">Drop PDFs here or <span className="text-amber-400">browse</span></p>
        <p className="text-xs text-zinc-600">Add as many files as you need</p>
      </div>

      {/* File list */}
      {entries.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">
              {entries.length} file{entries.length !== 1 ? "s" : ""}
              {totalPages > 0 && <span className="ml-2 text-zinc-500">· {totalPages} pages total</span>}
            </span>
            <button type="button" onClick={() => { setEntries([]); setResult(null); setMergeError(""); }}
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">Clear all</button>
          </div>

          <div className="flex flex-col gap-1.5">
            {entries.map((entry, idx) => {
              const isDragging = dragId === entry.id;
              const isOver = dragOverId === entry.id && dragId !== entry.id;
              return (
                <div
                  key={entry.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; setDragId(entry.id); }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverId(entry.id); }}
                  onDragLeave={() => setDragOverId(null)}
                  onDrop={(e) => { e.preventDefault(); if (dragId) reorder(dragId, entry.id); setDragId(null); setDragOverId(null); }}
                  onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-100 cursor-grab active:cursor-grabbing ${
                    isDragging ? "opacity-40" :
                    isOver ? "border-amber-400/60 bg-amber-400/5" :
                    entry.error ? "border-red-900/50 bg-red-950/20" :
                    "border-zinc-800 bg-zinc-950"
                  }`}
                >
                  {/* Drag handle */}
                  <svg className="h-4 w-4 shrink-0 text-zinc-600" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="5" cy="4" r="1.5" /><circle cx="11" cy="4" r="1.5" />
                    <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                    <circle cx="5" cy="12" r="1.5" /><circle cx="11" cy="12" r="1.5" />
                  </svg>

                  {/* Arrow controls */}
                  <div className="flex flex-col gap-0.5">
                    <button type="button" disabled={idx === 0} onClick={() => move(entry.id, -1)}
                      className={btnSm + " px-1.5 py-0.5"} aria-label="Move up">↑</button>
                    <button type="button" disabled={idx === entries.length - 1} onClick={() => move(entry.id, 1)}
                      className={btnSm + " px-1.5 py-0.5"} aria-label="Move down">↓</button>
                  </div>

                  <span className="w-5 shrink-0 text-center font-mono text-xs text-zinc-600">{idx + 1}</span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">{entry.file.name}</p>
                    {entry.error ? (
                      <p className="text-xs text-red-400">{entry.error}</p>
                    ) : (
                      <p className="text-xs text-zinc-500">
                        {fmtBytes(entry.file.size)}
                        {entry.pageCount !== null && ` · ${entry.pageCount} page${entry.pageCount !== 1 ? "s" : ""}`}
                      </p>
                    )}
                  </div>

                  <button type="button" onClick={() => remove(entry.id)}
                    className="shrink-0 text-xs text-zinc-600 transition-colors hover:text-red-400" aria-label="Remove">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mergeError && <p className="font-mono text-xs text-red-400">{mergeError}</p>}

      <div className="flex items-center gap-3">
        <button type="button" onClick={merge} disabled={!canMerge}
          className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40">
          {merging ? "Merging…" : `Merge ${validCount} PDFs`}
        </button>
        {entries.length > 0 && (
          <button type="button" onClick={() => inputRef.current?.click()} className={btnSm}>+ Add more</button>
        )}
      </div>

      {/* Result preview */}
      {result && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-zinc-300">Merged PDF</span>
              <span className="ml-2 text-xs text-zinc-500">{result.pageCount} pages · {fmtBytes(result.bytes)}</span>
            </div>
            <button type="button" onClick={download}
              className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-400/20">
              Download
            </button>
          </div>
          <iframe src={result.url} className="h-[600px] w-full rounded-xl border border-zinc-700 bg-zinc-950" title="Merged PDF preview" />
        </div>
      )}
    </div>
  );
}
