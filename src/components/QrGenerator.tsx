"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type ErrorLevel = "L" | "M" | "Q" | "H";

const ERROR_LEVELS: { value: ErrorLevel; label: string; title: string }[] = [
  { value: "L", label: "L", title: "Low — 7% data recovery" },
  { value: "M", label: "M", title: "Medium — 15% data recovery" },
  { value: "Q", label: "Q", title: "Quartile — 25% data recovery" },
  { value: "H", label: "H", title: "High — 30% data recovery (best for logos overlaid)" },
];

const SIZES = [128, 256, 512] as const;

const btnCls =
  "rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-5 w-5 shrink-0 cursor-pointer rounded-sm bg-transparent p-0 [border:none] [outline:none]"
        />
        <span className="font-mono text-sm text-zinc-400">{value}</span>
      </div>
    </div>
  );
}

export function QrGenerator() {
  const [text, setText] = useState("");
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");
  const [size, setSize] = useState<(typeof SIZES)[number]>(256);
  const [fgColor, setFgColor] = useState("#18181b");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [pngCopied, setPngCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasText = text.trim().length > 0;

  // Regenerate whenever any input changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!hasText) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    QRCode.toCanvas(canvas, text.trim(), {
      width: size,
      margin: 2,
      errorCorrectionLevel: errorLevel,
      color: { dark: fgColor, light: bgColor },
    }).catch(() => {});
  }, [text, errorLevel, size, fgColor, bgColor, hasText]);

  function downloadPng() {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "qr-code.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  async function downloadSvg() {
    if (!hasText) return;
    const svg = await QRCode.toString(text.trim(), {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: errorLevel,
      color: { dark: fgColor, light: bgColor },
    });
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyPng() {
    canvasRef.current?.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setPngCopied(true);
        setTimeout(() => setPngCopied(false), 1500);
      } catch {}
    });
  }

  return (
    <div className="w-full max-w-lg">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">QR Code Generator</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Generate QR codes for URLs, text, Wi-Fi credentials, or anything else.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Text input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-300">Content</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="https://example.com"
            rows={3}
            spellCheck={false}
            className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4">
          {/* Error correction */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Error correction</label>
            <div className="flex gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
              {ERROR_LEVELS.map(({ value, label, title }) => (
                <button
                  key={value}
                  type="button"
                  title={title}
                  onClick={() => setErrorLevel(value)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    errorLevel === value
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Size (px)</label>
            <div className="flex gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                    size === s
                      ? "bg-zinc-700 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <ColorField label="Foreground" value={fgColor} onChange={setFgColor} />
          <ColorField label="Background" value={bgColor} onChange={setBgColor} />
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center gap-4 pt-1">
          <div className="relative flex items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            {/* Canvas always in DOM so the ref is always valid */}
            <canvas
              ref={canvasRef}
              className={`transition-opacity duration-200 ${hasText ? "opacity-100" : "opacity-0"}`}
              style={{ width: Math.min(size, 272), height: Math.min(size, 272) }}
            />
            {!hasText && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ width: 280, height: 280 }}
              >
                <p className="text-xs text-zinc-600">Enter content above</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button type="button" onClick={downloadPng} disabled={!hasText} className={btnCls}>
              Download PNG
            </button>
            <button type="button" onClick={downloadSvg} disabled={!hasText} className={btnCls}>
              Download SVG
            </button>
            <button type="button" onClick={copyPng} disabled={!hasText} className={btnCls}>
              {pngCopied ? "Copied!" : "Copy PNG"}
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
