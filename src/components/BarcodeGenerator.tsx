"use client";

import { useEffect, useRef, useState } from "react";
import bwipjs from "bwip-js/browser";

type BarcodeType = {
  label: string;
  bcid: string;
  group: "1D" | "2D";
};

const BARCODE_TYPES: BarcodeType[] = [
  { label: "Code 128", bcid: "code128", group: "1D" },
  { label: "Code 39", bcid: "code39", group: "1D" },
  { label: "EAN-13", bcid: "ean13", group: "1D" },
  { label: "EAN-8", bcid: "ean8", group: "1D" },
  { label: "UPC-A", bcid: "upca", group: "1D" },
  { label: "UPC-E", bcid: "upce", group: "1D" },
  { label: "ITF", bcid: "interleaved2of5", group: "1D" },
  { label: "Codabar", bcid: "codabar", group: "1D" },
  { label: "QR Code", bcid: "qrcode", group: "2D" },
  { label: "Data Matrix", bcid: "datamatrix", group: "2D" },
  { label: "PDF417", bcid: "pdf417", group: "2D" },
  { label: "Aztec", bcid: "aztec", group: "2D" },
];

const TYPES_1D = BARCODE_TYPES.filter((t) => t.group === "1D");
const TYPES_2D = BARCODE_TYPES.filter((t) => t.group === "2D");

function hexToRgb(hex: string): string {
  return hex.replace("#", "");
}

export function BarcodeGenerator() {
  const [text, setText] = useState("");
  const [barcodeType, setBarcodeType] = useState<BarcodeType>(BARCODE_TYPES[0]);
  const [scale, setScale] = useState(3);
  const [includeText, setIncludeText] = useState(true);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [fgColor, setFgColor] = useState("#000000");
  const [error, setError] = useState<string | null>(null);
  const [hasRendered, setHasRendered] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const hasText = text.trim().length > 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasText) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = 1;
        canvas.height = 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setError(null);
      setHasRendered(false);
      return;
    }

    try {
      bwipjs.toCanvas(canvas, {
        bcid: barcodeType.bcid,
        text: text.trim(),
        scale,
        height: 10,
        includetext: includeText,
        textxalign: "center",
        backgroundcolor: hexToRgb(bgColor),
        barcolor: hexToRgb(fgColor),
      });
      setError(null);
      setHasRendered(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input for this barcode type.");
      setHasRendered(false);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = 1;
        canvas.height = 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [text, barcodeType, scale, includeText, bgColor, fgColor, hasText]);

  function downloadPng() {
    if (!hasRendered) return;
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `barcode-${barcodeType.bcid}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  function downloadSvg() {
    if (!hasRendered) return;
    try {
      const svg = bwipjs.toSVG({
        bcid: barcodeType.bcid,
        text: text.trim(),
        scale,
        height: 10,
        includetext: includeText,
        textxalign: "center",
        backgroundcolor: hexToRgb(bgColor),
        barcolor: hexToRgb(fgColor),
      });
      const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `barcode-${barcodeType.bcid}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently ignore
    }
  }

  const selectedBcid = barcodeType.bcid;

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Barcode Generator</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Generate barcodes and QR codes entirely in your browser.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Text input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Content</label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to encode…"
            spellCheck={false}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        {/* Barcode type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Barcode type</label>
          <select
            value={selectedBcid}
            onChange={(e) => {
              const found = BARCODE_TYPES.find((t) => t.bcid === e.target.value);
              if (found) setBarcodeType(found);
            }}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
          >
            <optgroup label="1D Codes">
              {TYPES_1D.map((t) => (
                <option key={t.bcid} value={t.bcid}>
                  {t.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="2D Codes">
              {TYPES_2D.map((t) => (
                <option key={t.bcid} value={t.bcid}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Scale + Include text */}
        <div className="flex items-end gap-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Scale — <span className="text-amber-400">{scale}×</span>
            </label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
          <label className="mb-1 flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={includeText}
              onChange={(e) => setIncludeText(e.target.checked)}
              className="h-4 w-4 accent-amber-400"
            />
            Include text
          </label>
        </div>

        {/* Colors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Foreground</span>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="h-5 w-5 shrink-0 cursor-pointer rounded-sm bg-transparent p-0 [border:none] [outline:none]"
              />
              <span className="font-mono text-sm text-zinc-400">{fgColor}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">Background</span>
            <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-5 w-5 shrink-0 cursor-pointer rounded-sm bg-transparent p-0 [border:none] [outline:none]"
              />
              <span className="font-mono text-sm text-zinc-400">{bgColor}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {/* Preview */}
        <div className="flex flex-col items-center gap-4 pt-1">
          <div className="flex min-h-[96px] items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            {hasText && hasRendered ? (
              <canvas
                ref={canvasRef}
                className="max-w-full rounded"
                style={{ imageRendering: "pixelated" }}
              />
            ) : (
              <>
                {/* Keep canvas mounted for bwip-js to render into, hidden when no output */}
                <canvas ref={canvasRef} className="hidden" />
                <p className="text-xs text-zinc-600">
                  {hasText && error ? "Fix the error above to preview" : "Enter content above to preview"}
                </p>
              </>
            )}
          </div>

          {/* Download buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={downloadPng}
              disabled={!hasRendered}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download PNG
            </button>
            <button
              type="button"
              onClick={downloadSvg}
              disabled={!hasRendered}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Download SVG
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
