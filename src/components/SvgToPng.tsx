"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Tab = "paste" | "upload";
type Scale = 1 | 2 | 3 | 4;

function getSvgDimensions(svg: string): { width: number; height: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const el = doc.querySelector("svg");
  const w = parseFloat(el?.getAttribute("width") ?? "0");
  const h = parseFloat(el?.getAttribute("height") ?? "0");
  if (!w || !h) {
    const vb = el?.getAttribute("viewBox")?.split(/[\s,]+/).map(Number);
    if (vb && vb.length === 4) return { width: vb[2], height: vb[3] };
  }
  return { width: w || 800, height: h || 600 };
}

async function svgToPng(
  svgString: string,
  width: number,
  height: number,
  scale: number,
  transparent: boolean,
): Promise<Blob> {
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext("2d")!;
      if (!transparent) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create PNG blob"))),
        "image/png",
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid SVG"));
    };
    img.src = url;
  });
}

const EXAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="#f59e0b" />
</svg>`;

export function SvgToPng() {
  const [tab, setTab] = useState<Tab>("paste");
  const [svgText, setSvgText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dropHover, setDropHover] = useState(false);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [scale, setScale] = useState<Scale>(2);
  const [transparent, setTransparent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevPreviewUrlRef = useRef<string | null>(null);

  const hasSvg = svgText.trim().length > 0;

  // Update dimensions when SVG changes
  useEffect(() => {
    if (!hasSvg) {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
        prevPreviewUrlRef.current = null;
      }
      setPreviewUrl(null);
      setError(null);
      return;
    }

    const trimmed = svgText.trim();

    // Basic SVG validation
    if (!trimmed.includes("<svg")) {
      setError("Input does not appear to be valid SVG.");
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
        prevPreviewUrlRef.current = null;
      }
      setPreviewUrl(null);
      return;
    }

    setError(null);

    // Update width/height from SVG
    const dims = getSvgDimensions(trimmed);
    setWidth(Math.round(dims.width));
    setHeight(Math.round(dims.height));

    // Build preview blob URL
    if (prevPreviewUrlRef.current) {
      URL.revokeObjectURL(prevPreviewUrlRef.current);
    }
    const blob = new Blob([trimmed], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    prevPreviewUrlRef.current = url;
    setPreviewUrl(url);
  }, [svgText, hasSvg]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevPreviewUrlRef.current) {
        URL.revokeObjectURL(prevPreviewUrlRef.current);
      }
    };
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
      setError("Please upload an SVG file.");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === "string") {
        setSvgText(result);
        setError(null);
      }
    };
    reader.readAsText(file);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropHover(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  async function convertAndDownload() {
    if (!hasSvg || error || converting) return;
    setConverting(true);
    try {
      const blob = await svgToPng(svgText.trim(), width, height, scale, transparent);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = fileName ? fileName.replace(/\.svg$/i, "") : "image";
      a.download = `${base}@${scale}x.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Conversion failed.");
    } finally {
      setConverting(false);
    }
  }

  async function copyPng() {
    if (!hasSvg || error || copying) return;
    try {
      const blob = await svgToPng(svgText.trim(), width, height, scale, transparent);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copy failed.");
    }
  }

  const copying = false; // local flag to avoid double-click issues; state handles UX via `copied`

  const canConvert = hasSvg && !error;

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">SVG to PNG</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Convert SVG files to PNG images — entirely in your browser.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Tab toggle */}
        <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
          <button
            type="button"
            onClick={() => setTab("paste")}
            className={
              tab === "paste"
                ? "rounded-lg px-3 py-1.5 text-sm font-medium bg-zinc-700 text-zinc-100"
                : "rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-300"
            }
          >
            Paste SVG
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={
              tab === "upload"
                ? "rounded-lg px-3 py-1.5 text-sm font-medium bg-zinc-700 text-zinc-100"
                : "rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-300"
            }
          >
            Upload file
          </button>
        </div>

        {/* Paste tab */}
        {tab === "paste" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">SVG code</label>
            <textarea
              value={svgText}
              onChange={(e) => setSvgText(e.target.value)}
              placeholder={EXAMPLE_SVG}
              rows={7}
              spellCheck={false}
              className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
            />
          </div>
        )}

        {/* Upload tab */}
        {tab === "upload" && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              className="sr-only"
              onChange={handleFileChange}
            />
            {!fileName ? (
              <div
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-zinc-900 py-12 transition-colors cursor-pointer ${
                  dropHover
                    ? "border-amber-400/60 bg-amber-400/5"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropHover(true);
                }}
                onDragLeave={() => setDropHover(false)}
                onDrop={onDrop}
              >
                <svg
                  className="h-10 w-10 text-zinc-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p className="text-sm text-zinc-400">
                  Drop an SVG file here or{" "}
                  <span className="text-amber-400">browse</span>
                </p>
                <p className="text-xs text-zinc-600">.svg files only</p>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
                <p className="truncate text-sm font-medium text-zinc-200">{fileName}</p>
                <button
                  type="button"
                  onClick={() => {
                    setFileName(null);
                    setSvgText("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Remove
                </button>
              </div>
            )}
          </>
        )}

        {/* Error */}
        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {/* Controls */}
        {hasSvg && !error && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">Width (px)</label>
                <input
                  type="number"
                  min={1}
                  value={width}
                  onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">Height (px)</label>
                <input
                  type="number"
                  min={1}
                  value={height}
                  onChange={(e) => setHeight(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-300">Scale</span>
                <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
                  {([1, 2, 3, 4] as Scale[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScale(s)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        scale === s
                          ? "bg-zinc-700 text-zinc-100"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-300 pt-6">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                  className="h-4 w-4 accent-amber-400"
                />
                Transparent background
              </label>
            </div>

            <p className="text-xs text-zinc-500">
              Output:{" "}
              <span className="font-mono text-zinc-300">
                {width * scale} &times; {height * scale} px
              </span>
            </p>
          </>
        )}

        {/* SVG Preview */}
        {previewUrl && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Preview</span>
            <div className="flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="SVG preview"
                className="max-h-48 max-w-full object-contain"
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={convertAndDownload}
            disabled={!canConvert || converting}
            className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {converting ? "Converting…" : "Convert & Download PNG"}
          </button>
          <button
            type="button"
            onClick={copyPng}
            disabled={!canConvert}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {copied ? "Copied!" : "Copy PNG"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
