"use client";

import { useEffect, useRef, useState } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

const ST_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
const MT_BASE_URL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";

let sharedInstance: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (sharedInstance) return sharedInstance;
  if (loadPromise) return loadPromise;

  const useMT = window.crossOriginIsolated;
  const base = useMT ? MT_BASE_URL : ST_BASE_URL;

  loadPromise = (async () => {
    const [coreURL, wasmURL, workerURL] = await Promise.all([
      toBlobURL(`${base}/ffmpeg-core.js`, "text/javascript"),
      toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm"),
      useMT
        ? toBlobURL(`${base}/ffmpeg-core.worker.js`, "text/javascript")
        : Promise.resolve(undefined),
    ]);
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL,
      wasmURL,
      ...(workerURL ? { workerURL } : {}),
      classWorkerURL: new URL(
        "/ffmpeg/worker.js",
        window.location.origin,
      ).toString(),
    });
    sharedInstance = ffmpeg;
    return ffmpeg;
  })();

  return loadPromise;
}

export function useFFmpeg() {
  const [loaded, setLoaded] = useState(sharedInstance !== null);
  const [error, setError] = useState<string | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(sharedInstance);

  useEffect(() => {
    if (sharedInstance) {
      ffmpegRef.current = sharedInstance;
      setLoaded(true);
      return;
    }
    let cancelled = false;
    getFFmpeg()
      .then((ff) => {
        if (cancelled) return;
        ffmpegRef.current = ff;
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { loaded, error, ffmpegRef };
}
