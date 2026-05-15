"use client";

import { useCallback, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

interface PageInfo {
  number: number;
  widthPt: number;
  heightPt: number;
  orientation: "portrait" | "landscape";
}

interface PdfData {
  fileName: string;
  fileSize: number;
  pageCount: number;
  title: string;
  author: string;
  subject: string;
  creator: string;
  producer: string;
  creationDate: string;
  modDate: string;
  pages: PageInfo[];
}

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(2)} MB`;
}

function ptToMm(pt: number) {
  return (pt * 25.4 / 72).toFixed(1);
}

function fmtDate(d: Date | undefined): string {
  if (!d) return "—";
  try { return d.toLocaleString(); } catch { return "—"; }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
      <span className="shrink-0 text-xs text-zinc-500">{label}</span>
      <span className="break-all text-right font-mono text-sm text-zinc-200">{value || "—"}</span>
    </div>
  );
}

function getDisplayedPages(pages: PageInfo[]): Array<PageInfo | null> {
  if (pages.length <= 10) return pages;
  return [...pages.slice(0, 5), null, ...pages.slice(-5)];
}

export function PdfInspector() {
  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [error, setError] = useState("");
  const [dropHover, setDropHover] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    setError(""); setPdfData(null); setLoading(true);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pdfPages = doc.getPages();
      const pages: PageInfo[] = pdfPages.map((p, i) => {
        const { width, height } = p.getSize();
        return { number: i + 1, widthPt: Math.round(width * 10) / 10, heightPt: Math.round(height * 10) / 10, orientation: width >= height ? "landscape" : "portrait" };
      });
      setPdfData({
        fileName: file.name, fileSize: file.size,
        pageCount: doc.getPageCount(),
        title: doc.getTitle() ?? "", author: doc.getAuthor() ?? "",
        subject: doc.getSubject() ?? "", creator: doc.getCreator() ?? "",
        producer: doc.getProducer() ?? "",
        creationDate: fmtDate(doc.getCreationDate()),
        modDate: fmtDate(doc.getModificationDate()),
        pages,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read PDF.");
    } finally {
      setLoading(false);
    }
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDropHover(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }

  function downloadJson() {
    if (!pdfData) return;
    const blob = new Blob([JSON.stringify(pdfData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${pdfData.fileName.replace(/\.pdf$/i, "")}-metadata.json`; a.click();
    URL.revokeObjectURL(url);
  }

  const dropCls = `flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors cursor-pointer py-12 ${
    dropHover ? "border-amber-400/60 bg-amber-400/5" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
  }`;

  return (
    <div className="flex flex-col gap-5">
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="sr-only"
        onChange={(e) => { if (e.target.files?.[0]) loadFile(e.target.files[0]); }} />

      {!pdfData && !loading && (
        <div className={dropCls} onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
          onDragLeave={() => setDropHover(false)} onDrop={onDrop}>
          <svg className="h-10 w-10 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="15" x2="15" y2="15" /><line x1="9" y1="11" x2="15" y2="11" />
          </svg>
          <p className="text-sm text-zinc-400">Drop a PDF here or <span className="text-amber-400">browse</span></p>
          <p className="text-xs text-zinc-600">PDF files only</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-12">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-amber-400" />
          <span className="text-sm text-zinc-400">Reading PDF…</span>
        </div>
      )}

      {error && <p className="font-mono text-xs text-red-400">{error}</p>}

      {pdfData && (
        <>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">{pdfData.fileName}</p>
              <p className="text-xs text-zinc-500">{fmtBytes(pdfData.fileSize)} · {pdfData.pageCount} pages</p>
            </div>
            <button type="button" onClick={() => { setPdfData(null); setError(""); }}
              className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300">Change</button>
          </div>

          <div>
            <span className="text-sm font-medium text-zinc-300">Metadata</span>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoRow label="Title" value={pdfData.title} />
              <InfoRow label="Author" value={pdfData.author} />
              <InfoRow label="Subject" value={pdfData.subject} />
              <InfoRow label="Creator" value={pdfData.creator} />
              <InfoRow label="Producer" value={pdfData.producer} />
              <InfoRow label="Pages" value={String(pdfData.pageCount)} />
              <InfoRow label="Created" value={pdfData.creationDate} />
              <InfoRow label="Modified" value={pdfData.modDate} />
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-zinc-300">Pages</span>
            <div className="mt-2 flex flex-col gap-1.5">
              {getDisplayedPages(pdfData.pages).map((page, idx) =>
                page === null ? (
                  <div key={`sep-${idx}`} className="flex items-center justify-center py-1 text-xs text-zinc-600">
                    · · · {pdfData.pageCount - 10} more pages · · ·
                  </div>
                ) : (
                  <div key={page.number} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <span className="text-xs text-zinc-500">Page {page.number}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-zinc-400">{page.widthPt} × {page.heightPt} pt</span>
                      <span className="font-mono text-xs text-zinc-600">({ptToMm(page.widthPt)} × {ptToMm(page.heightPt)} mm)</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs ${page.orientation === "portrait" ? "bg-zinc-800 text-zinc-400" : "bg-amber-400/10 text-amber-400"}`}>
                        {page.orientation}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <button type="button" onClick={downloadJson}
            className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300">
            Download JSON
          </button>
        </>
      )}
    </div>
  );
}
