"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type OutputFormat = "image/png" | "image/jpeg" | "image/webp";
type DragHandle   = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "move";

const FORMAT_OPTS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: "image/png",  label: "PNG",  ext: "png"  },
  { value: "image/jpeg", label: "JPEG", ext: "jpg"  },
  { value: "image/webp", label: "WebP", ext: "webp" },
];

const SCALE_PRESETS = [25, 50, 75, 100] as const;
const MAX_PREVIEW   = 480; // max display dimension in px
const HR            = 5;   // handle visual radius
const HIT           = 10;  // handle hit-area radius

interface ImageInfo { file: File; src: string; origW: number; origH: number }
interface CropRect  { x: number; y: number; w: number; h: number } // image-pixel space
interface DragState {
  handle: DragHandle;
  startMX: number; startMY: number;   // client coords at mousedown
  svgLeft: number; svgTop: number;    // SVG bounding rect captured once
  svgW:    number; svgH:    number;
  startCrop: CropRect;
  imgW: number; imgH: number;
}

function fmtBytes(b: number) {
  if (b < 1024)        return `${b} B`;
  if (b < 1_048_576)   return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(2)} MB`;
}

function clamp(v: number, lo: number, hi: number) { return Math.min(Math.max(v, lo), hi); }
function parsePositive(s: string) { const n = parseInt(s, 10); return isNaN(n) || n < 1 ? 1 : n; }

export function ImageResize() {
  const [img,         setImg]         = useState<ImageInfo | null>(null);
  const [width,       setWidth]       = useState(0);
  const [height,      setHeight]      = useState(0);
  const [lock,        setLock]        = useState(true);
  const [format,      setFormat]      = useState<OutputFormat>("image/png");
  const [quality,     setQuality]     = useState(90);
  const [dropHover,   setDropHover]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [cropMode,    setCropMode]    = useState(false);
  const [crop,        setCrop]        = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });

  const inputRef  = useRef<HTMLInputElement>(null);
  const objUrlRef = useRef<string | null>(null);
  const svgRef    = useRef<SVGSVGElement>(null);
  const dragRef   = useRef<DragState | null>(null);

  // ── Display geometry ───────────────────────────────────────────────────────
  const dispScale = img ? Math.min(MAX_PREVIEW / img.origW, MAX_PREVIEW / img.origH, 1) : 1;
  const dispW     = img ? Math.round(img.origW * dispScale) : 0;
  const dispH     = img ? Math.round(img.origH * dispScale) : 0;

  // Crop rect in display-pixel (SVG viewBox) space
  const cX = Math.round(crop.x * dispScale);
  const cY = Math.round(crop.y * dispScale);
  const cW = Math.max(1, Math.round(crop.w * dispScale));
  const cH = Math.max(1, Math.round(crop.h * dispScale));

  // ── File loading ───────────────────────────────────────────────────────────
  const freeObjUrl = () => {
    if (objUrlRef.current) { URL.revokeObjectURL(objUrlRef.current); objUrlRef.current = null; }
  };
  useEffect(() => () => freeObjUrl(), []);

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    freeObjUrl();
    const src = URL.createObjectURL(file);
    objUrlRef.current = src;
    const el = new Image();
    el.onload = () => {
      const info = { file, src, origW: el.naturalWidth, origH: el.naturalHeight };
      setImg(info);
      setWidth(el.naturalWidth);
      setHeight(el.naturalHeight);
      setCropMode(false);
      setCrop({ x: 0, y: 0, w: el.naturalWidth, h: el.naturalHeight });
    };
    el.src = src;
  }, []);

  function handleFiles(files: FileList | null) { if (files?.[0]) loadFile(files[0]); }
  function onDrop(e: React.DragEvent) { e.preventDefault(); setDropHover(false); handleFiles(e.dataTransfer.files); }

  // ── Crop mode toggle ───────────────────────────────────────────────────────
  function toggleCrop() {
    if (!img) return;
    if (!cropMode) {
      setCrop({ x: 0, y: 0, w: img.origW, h: img.origH });
      setWidth(img.origW);
      setHeight(img.origH);
    } else {
      setWidth(img.origW);
      setHeight(img.origH);
    }
    setCropMode((m) => !m);
  }

  function resetCrop() {
    if (!img) return;
    setCrop({ x: 0, y: 0, w: img.origW, h: img.origH });
  }

  // Sync width/height to crop dimensions while in crop mode
  useEffect(() => {
    if (cropMode && crop.w > 0 && crop.h > 0) {
      setWidth(crop.w);
      setHeight(crop.h);
    }
  }, [cropMode, crop.w, crop.h]);

  // ── Crop drag ──────────────────────────────────────────────────────────────
  function startCropDrag(e: React.MouseEvent, handle: DragHandle) {
    e.preventDefault();
    if (!img || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    dragRef.current = {
      handle,
      startMX: e.clientX, startMY: e.clientY,
      svgLeft: r.left,   svgTop:  r.top,
      svgW:    r.width,  svgH:    r.height,
      startCrop: { ...crop },
      imgW: img.origW,   imgH: img.origH,
    };
  }

  useEffect(() => {
    if (!cropMode) return;

    function onMove(e: MouseEvent) {
      const d = dragRef.current;
      if (!d) return;

      // Delta in image-pixel space
      const dx = ((e.clientX - d.startMX) / d.svgW) * d.imgW;
      const dy = ((e.clientY - d.startMY) / d.svgH) * d.imgH;
      const MIN = 10;
      let { x, y, w, h } = d.startCrop;

      if (d.handle === "move") {
        x = clamp(d.startCrop.x + dx, 0, d.imgW - w);
        y = clamp(d.startCrop.y + dy, 0, d.imgH - h);
      } else {
        if (d.handle.includes("n")) {
          const ny = clamp(d.startCrop.y + dy, 0, d.startCrop.y + d.startCrop.h - MIN);
          h = d.startCrop.y + d.startCrop.h - ny; y = ny;
        }
        if (d.handle.includes("s")) {
          h = clamp(d.startCrop.h + dy, MIN, d.imgH - d.startCrop.y);
        }
        if (d.handle.includes("w")) {
          const nx = clamp(d.startCrop.x + dx, 0, d.startCrop.x + d.startCrop.w - MIN);
          w = d.startCrop.x + d.startCrop.w - nx; x = nx;
        }
        if (d.handle.includes("e")) {
          w = clamp(d.startCrop.w + dx, MIN, d.imgW - d.startCrop.x);
        }
      }

      setCrop({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
    }

    function onUp() { dragRef.current = null; }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [cropMode]);

  // ── Scale / size helpers ───────────────────────────────────────────────────
  const srcW = cropMode ? crop.w : (img?.origW ?? 0);
  const srcH = cropMode ? crop.h : (img?.origH ?? 0);

  function setScale(pct: number) {
    setWidth(Math.round(srcW * pct / 100));
    setHeight(Math.round(srcH * pct / 100));
  }

  function changeWidth(v: number) {
    setWidth(v);
    if (lock && srcW) setHeight(Math.round(v / srcW * srcH));
  }

  function changeHeight(v: number) {
    setHeight(v);
    if (lock && srcH) setWidth(Math.round(v / srcH * srcW));
  }

  // ── Download ───────────────────────────────────────────────────────────────
  async function download() {
    if (!img || downloading) return;
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      const el  = new Image();
      await new Promise<void>((res, rej) => { el.onload = () => res(); el.onerror = rej; el.src = img.src; });

      if (cropMode && crop.w > 0 && crop.h > 0) {
        ctx.drawImage(el, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
      } else {
        ctx.drawImage(el, 0, 0, width, height);
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const ext  = FORMAT_OPTS.find((f) => f.value === format)!.ext;
          const base = img.file.name.replace(/\.[^.]+$/, "");
          const tag  = cropMode ? `-crop-${width}x${height}` : `-${width}x${height}`;
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement("a");
          a.href = url; a.download = `${base}${tag}.${ext}`; a.click();
          URL.revokeObjectURL(url);
        },
        format,
        format !== "image/png" ? quality / 100 : undefined,
      );
    } finally {
      setDownloading(false);
    }
  }

  // ── SVG handles config ─────────────────────────────────────────────────────
  const handles: { id: DragHandle; x: number; y: number; cursor: string }[] = [
    { id: "nw", x: cX,          y: cY,          cursor: "nw-resize" },
    { id: "n",  x: cX + cW / 2, y: cY,          cursor: "n-resize"  },
    { id: "ne", x: cX + cW,     y: cY,          cursor: "ne-resize" },
    { id: "e",  x: cX + cW,     y: cY + cH / 2, cursor: "e-resize"  },
    { id: "se", x: cX + cW,     y: cY + cH,     cursor: "se-resize" },
    { id: "s",  x: cX + cW / 2, y: cY + cH,     cursor: "s-resize"  },
    { id: "sw", x: cX,          y: cY + cH,     cursor: "sw-resize" },
    { id: "w",  x: cX,          y: cY + cH / 2, cursor: "w-resize"  },
  ];

  const hasImg        = img !== null;
  const needsQuality  = format === "image/jpeg" || format === "image/webp";
  const dropCls = `flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors cursor-pointer select-none py-12 ${
    dropHover ? "border-amber-400/60 bg-amber-400/5" : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
  }`;

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Image Resize</h1>
        <p className="mt-2 text-sm text-zinc-400">Resize and crop images locally — nothing is uploaded.</p>
      </header>

      {/* File input always in DOM */}
      <input ref={inputRef} type="file" accept="image/*" className="sr-only"
        onChange={(e) => handleFiles(e.target.files)} />

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">

        {/* Drop zone */}
        {!hasImg && (
          <div className={dropCls}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
            onDragLeave={() => setDropHover(false)}
            onDrop={onDrop}>
            <svg className="h-10 w-10 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <p className="text-sm text-zinc-400">Drop an image here or <span className="text-amber-400">browse</span></p>
            <p className="text-xs text-zinc-600">PNG, JPEG, WebP, GIF, BMP, …</p>
          </div>
        )}

        {/* File info bar */}
        {hasImg && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">{img.file.name}</p>
              <p className="text-xs text-zinc-500">{fmtBytes(img.file.size)} · {img.origW}×{img.origH} px</p>
            </div>
            <button type="button" onClick={() => inputRef.current?.click()}
              className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300">
              Change
            </button>
          </div>
        )}

        {hasImg && (
          <>
            {/* ── Crop toggle ── */}
            <div className="flex items-center gap-3">
              <button type="button" onClick={toggleCrop}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  cropMode
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
                }`}>
                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 1v3H1M4 15v-3H1M12 1v3h3M12 15v-3h3" />
                  <rect x="4" y="4" width="8" height="8" />
                </svg>
                Crop
              </button>

              {cropMode && (
                <>
                  <span className="text-xs tabular-nums text-zinc-500">
                    {crop.x},{crop.y} · {crop.w}×{crop.h}
                  </span>
                  <button type="button" onClick={resetCrop}
                    className="ml-auto text-xs text-zinc-500 transition-colors hover:text-zinc-300">
                    Reset
                  </button>
                </>
              )}
            </div>

            {/* ── Crop preview ── */}
            {cropMode && (
              <div className="flex justify-center">
                <div className="relative select-none overflow-hidden rounded-lg"
                  style={{ width: dispW, height: dispH }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt="" width={dispW} height={dispH}
                    className="pointer-events-none block" draggable={false} />

                  <svg ref={svgRef}
                    className="absolute inset-0 touch-none"
                    width={dispW} height={dispH}
                    viewBox={`0 0 ${dispW} ${dispH}`}>

                    {/* Dark overlay — 4 strips around the crop rect */}
                    <rect x={0}        y={0}        width={dispW}          height={cY}              fill="black" opacity="0.55" />
                    <rect x={0}        y={cY + cH}  width={dispW}          height={dispH - cY - cH} fill="black" opacity="0.55" />
                    <rect x={0}        y={cY}        width={cX}             height={cH}              fill="black" opacity="0.55" />
                    <rect x={cX + cW} y={cY}        width={dispW - cX - cW} height={cH}             fill="black" opacity="0.55" />

                    {/* Rule-of-thirds grid */}
                    {[1, 2].map((i) => (
                      <g key={i}>
                        <line x1={cX + (cW * i) / 3} y1={cY} x2={cX + (cW * i) / 3} y2={cY + cH}
                          stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
                        <line x1={cX} y1={cY + (cH * i) / 3} x2={cX + cW} y2={cY + (cH * i) / 3}
                          stroke="white" strokeOpacity="0.2" strokeWidth="0.5" />
                      </g>
                    ))}

                    {/* Crop border */}
                    <rect x={cX} y={cY} width={cW} height={cH} fill="none" stroke="white" strokeWidth="1" />

                    {/* Move handle (transparent overlay, below resize handles) */}
                    <rect x={cX} y={cY} width={cW} height={cH}
                      fill="transparent" style={{ cursor: "move" }}
                      onMouseDown={(e) => startCropDrag(e, "move")} />

                    {/* Resize handles */}
                    {handles.map(({ id, x, y, cursor }) => (
                      <g key={id} style={{ cursor }} onMouseDown={(e) => startCropDrag(e, id)}>
                        <circle cx={x} cy={y} r={HIT} fill="transparent" />
                        <circle cx={x} cy={y} r={HR}
                          fill="white" stroke="rgba(0,0,0,0.35)" strokeWidth="0.75" />
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            )}

            {/* ── Scale presets ── */}
            <div>
              <p className="mb-2 text-xs font-medium text-zinc-500">Quick scale</p>
              <div className="flex gap-2">
                {SCALE_PRESETS.map((pct) => {
                  const active =
                    width  === Math.round(srcW * pct / 100) &&
                    height === Math.round(srcH * pct / 100);
                  return (
                    <button key={pct} type="button" onClick={() => setScale(pct)}
                      className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100"
                      }`}>
                      {pct === 100 ? "Original" : `${pct}%`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Width / height ── */}
            <div className="flex items-end gap-3">
              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">Width (px)</label>
                <input type="number" min={1} value={width}
                  onChange={(e) => changeWidth(parsePositive(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60" />
              </div>

              <button type="button" title={lock ? "Unlock aspect ratio" : "Lock aspect ratio"}
                onClick={() => setLock(!lock)}
                className={`mb-px shrink-0 rounded-lg border p-2 transition-colors ${
                  lock
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
                    : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
                }`}>
                {lock ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 7-1" />
                  </svg>
                )}
              </button>

              <div className="flex flex-1 flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">Height (px)</label>
                <input type="number" min={1} value={height}
                  onChange={(e) => changeHeight(parsePositive(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60" />
              </div>
            </div>

            {/* ── Format + quality ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">Format</label>
                <div className="flex gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
                  {FORMAT_OPTS.map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => setFormat(value)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                        format === value ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {needsQuality ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-zinc-300">
                    Quality — <span className="text-amber-400">{quality}%</span>
                  </label>
                  <input type="range" min={1} max={100} value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="mt-2 w-full accent-amber-400" />
                </div>
              ) : <div />}
            </div>

            {/* ── Download ── */}
            <button type="button" onClick={download} disabled={downloading}
              className="w-full rounded-xl border border-amber-400/40 bg-amber-400/10 py-2.5 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-50">
              {downloading
                ? "Processing…"
                : `Download ${width}×${height} ${FORMAT_OPTS.find((f) => f.value === format)!.label}`}
            </button>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
