"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface VideoInfo {
  fileName: string;
  fileSize: number;
  duration: number;
  width: number;
  height: number;
}

interface CapturedFrame {
  dataUrl: string;
  timeSeconds: number;
}

const fmtTime = (s: number) =>
  `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(2)} MB`;
}

function parseTimeInput(value: string): number | null {
  const hhmmss = value.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (hhmmss) {
    const [, h, m, s] = hhmmss.map(Number);
    return h * 3600 + m * 60 + s;
  }
  const mmss = value.match(/^(\d+):(\d{1,2})$/);
  if (mmss) {
    const [, m, s] = mmss.map(Number);
    return m * 60 + s;
  }
  const secs = parseFloat(value);
  if (!isNaN(secs)) return secs;
  return null;
}

function captureFrame(video: HTMLVideoElement, timeSeconds: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d")!.drawImage(video, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        reject(e);
      }
    };
    video.onseeked = onSeeked;
    video.currentTime = timeSeconds;
  });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function VideoThumb() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [timeInput, setTimeInput] = useState("00:00");
  const [previewFrame, setPreviewFrame] = useState<string | null>(null);
  const [frames, setFrames] = useState<CapturedFrame[]>([]);
  const [multiCount, setMultiCount] = useState(6);
  const [extracting, setExtracting] = useState(false);
  const [capturingPreview, setCapturingPreview] = useState(false);
  const [dropHover, setDropHover] = useState(false);
  const [error, setError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objUrlRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cleanupVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current = null;
    }
    if (objUrlRef.current) {
      URL.revokeObjectURL(objUrlRef.current);
      objUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanupVideo(), [cleanupVideo]);

  const loadFile = useCallback((file: File) => {
    const accepted = /\.(mp4|webm|mov|avi|mkv)$/i.test(file.name) || file.type.startsWith("video/");
    if (!accepted) {
      setError("Please select a video file (mp4, webm, mov, avi, mkv).");
      return;
    }

    setError("");
    setVideoInfo(null);
    setPreviewFrame(null);
    setFrames([]);
    setCurrentTime(0);
    setTimeInput("00:00");
    cleanupVideo();

    const url = URL.createObjectURL(file);
    objUrlRef.current = url;

    const video = document.createElement("video");
    video.src = url;
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    videoRef.current = video;

    video.onloadedmetadata = () => {
      setVideoInfo({
        fileName: file.name,
        fileSize: file.size,
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      setError("Failed to load video. The format may not be supported by your browser.");
    };
  }, [cleanupVideo]);

  function handleFiles(files: FileList | null) {
    if (files?.[0]) loadFile(files[0]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropHover(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleSliderChange(v: number) {
    setCurrentTime(v);
    setTimeInput(fmtTime(v));
  }

  function handleTimeInputChange(value: string) {
    setTimeInput(value);
    const parsed = parseTimeInput(value);
    if (parsed !== null && videoInfo && parsed >= 0 && parsed <= videoInfo.duration) {
      setCurrentTime(parsed);
    }
  }

  function handleTimeInputBlur() {
    const parsed = parseTimeInput(timeInput);
    if (parsed !== null && videoInfo) {
      const clamped = Math.max(0, Math.min(parsed, videoInfo.duration));
      setCurrentTime(clamped);
      setTimeInput(fmtTime(clamped));
    } else {
      setTimeInput(fmtTime(currentTime));
    }
  }

  async function captureCurrentFrame() {
    if (!videoRef.current || !videoInfo) return;
    setCapturingPreview(true);
    setError("");
    try {
      const dataUrl = await captureFrame(videoRef.current, currentTime);
      setPreviewFrame(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to capture frame.");
    } finally {
      setCapturingPreview(false);
    }
  }

  function downloadPreviewFrame() {
    if (!previewFrame || !videoInfo) return;
    const baseName = videoInfo.fileName.replace(/\.[^.]+$/, "");
    downloadDataUrl(previewFrame, `${baseName}_${fmtTime(currentTime).replace(":", "m")}s.png`);
  }

  async function extractMultipleFrames() {
    if (!videoRef.current || !videoInfo) return;
    setExtracting(true);
    setError("");
    const newFrames: CapturedFrame[] = [];
    try {
      const count = Math.max(2, Math.min(20, multiCount));
      const step = videoInfo.duration / (count - 1);
      for (let i = 0; i < count; i++) {
        const t = Math.min(i * step, videoInfo.duration - 0.001);
        const dataUrl = await captureFrame(videoRef.current, t);
        newFrames.push({ dataUrl, timeSeconds: t });
      }
      setFrames(newFrames);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract frames.");
    } finally {
      setExtracting(false);
    }
  }

  function downloadFrame(frame: CapturedFrame, index: number) {
    if (!videoInfo) return;
    const baseName = videoInfo.fileName.replace(/\.[^.]+$/, "");
    downloadDataUrl(frame.dataUrl, `${baseName}_frame${index + 1}_${fmtTime(frame.timeSeconds).replace(":", "m")}s.png`);
  }

  const dropCls = `flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors cursor-pointer py-12 ${
    dropHover
      ? "border-amber-400/60 bg-amber-400/5"
      : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
  }`;

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Video Thumbnail</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Extract frames from videos as PNG images — nothing is uploaded.
        </p>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,.mp4,.webm,.mov,.avi,.mkv"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {!videoInfo && (
          <div
            className={dropCls}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
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
              <rect x="2" y="7" width="15" height="10" rx="2" />
              <path d="m17 9 5-2v10l-5-2V9z" />
            </svg>
            <p className="text-sm text-zinc-400">
              Drop a video here or <span className="text-amber-400">browse</span>
            </p>
            <p className="text-xs text-zinc-600">MP4, WebM, MOV, AVI, MKV</p>
          </div>
        )}

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {videoInfo && (
          <>
            {/* File info bar */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-200">{videoInfo.fileName}</p>
                <p className="text-xs text-zinc-500">
                  {fmtBytes(videoInfo.fileSize)} · {fmtTime(videoInfo.duration)} · {videoInfo.width}×{videoInfo.height} px
                </p>
              </div>
              <button
                type="button"
                onClick={() => { cleanupVideo(); setVideoInfo(null); setPreviewFrame(null); setFrames([]); setError(""); }}
                className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Change
              </button>
            </div>

            {/* Video info rows */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 gap-2">
                <span className="text-xs text-zinc-500">Duration</span>
                <span className="font-mono text-sm text-zinc-200">{fmtTime(videoInfo.duration)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 gap-2">
                <span className="text-xs text-zinc-500">Width</span>
                <span className="font-mono text-sm text-zinc-200">{videoInfo.width} px</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 gap-2">
                <span className="text-xs text-zinc-500">Height</span>
                <span className="font-mono text-sm text-zinc-200">{videoInfo.height} px</span>
              </div>
            </div>

            {/* Timestamp controls */}
            <div>
              <span className="text-sm font-medium text-zinc-300">Seek to frame</span>
              <div className="mt-2 flex flex-col gap-3">
                <input
                  type="range"
                  min={0}
                  max={videoInfo.duration}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={timeInput}
                    onChange={(e) => handleTimeInputChange(e.target.value)}
                    onBlur={handleTimeInputBlur}
                    placeholder="00:00 or HH:MM:SS"
                    className="w-36 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
                  />
                  <span className="text-xs text-zinc-500">
                    of {fmtTime(videoInfo.duration)}
                  </span>
                  <button
                    type="button"
                    onClick={captureCurrentFrame}
                    disabled={capturingPreview}
                    className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {capturingPreview ? "Capturing…" : "Capture This Frame"}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview frame */}
            {previewFrame && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">
                    Frame at {fmtTime(currentTime)}
                  </span>
                  <button
                    type="button"
                    onClick={downloadPreviewFrame}
                    className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                  >
                    Download PNG
                  </button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewFrame}
                  alt={`Frame at ${fmtTime(currentTime)}`}
                  className="w-full rounded-xl border border-zinc-800 object-contain"
                />
              </div>
            )}

            {/* Extract multiple frames */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <span className="text-sm font-medium text-zinc-300">Extract Multiple Frames</span>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-xs text-zinc-500 shrink-0">Count (2–20)</span>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={multiCount}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) setMultiCount(Math.max(2, Math.min(20, v)));
                  }}
                  className="w-20 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
                />
                <button
                  type="button"
                  onClick={extractMultipleFrames}
                  disabled={extracting}
                  className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {extracting ? "Extracting…" : "Extract All"}
                </button>
              </div>
            </div>

            {/* Frames grid */}
            {frames.length > 0 && (
              <div>
                <span className="text-sm font-medium text-zinc-300">
                  Extracted Frames ({frames.length})
                </span>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {frames.map((frame, i) => (
                    <div key={i} className="group relative flex flex-col gap-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={frame.dataUrl}
                        alt={`Frame ${i + 1} at ${fmtTime(frame.timeSeconds)}`}
                        className="w-full rounded-lg border border-zinc-800 object-cover aspect-video"
                      />
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs text-zinc-500">
                          {fmtTime(frame.timeSeconds)}
                        </span>
                        <button
                          type="button"
                          onClick={() => downloadFrame(frame, i)}
                          className="rounded-lg border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                        >
                          ↓ PNG
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
