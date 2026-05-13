"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFile } from "@ffmpeg/util";
import type { FFmpeg } from "@ffmpeg/ffmpeg";
import type {
  ConvertJob,
  ConverterType,
} from "@/src/types/converter";
import {
  extensionOf,
  IMAGE_MIME,
  normalizeExtension,
} from "@/src/utils/formats";
import { parseDuration, parseProgress } from "@/src/utils/parseProgress";

interface UseConverterOptions {
  type: ConverterType;
  ffmpegRef: React.RefObject<FFmpeg | null>;
  ffmpegLoaded: boolean;
}

function fileKey(f: File) {
  return `${f.name}:${f.size}:${f.lastModified}`;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useConverter({
  type,
  ffmpegRef,
  ffmpegLoaded,
}: UseConverterOptions) {
  const [jobs, setJobs] = useState<ConvertJob[]>([]);
  const [processing, setProcessing] = useState(false);
  const urlsRef = useRef<Set<string>>(new Set());
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current.clear();
    };
  }, []);

  const updateJob = useCallback(
    (id: string, patch: Partial<ConvertJob>) => {
      setJobs((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...patch } : j)),
      );
    },
    [],
  );

  const addFiles = useCallback((files: File[]) => {
    setJobs((prev) => {
      const seen = new Set(prev.map((j) => fileKey(j.file)));
      const additions: ConvertJob[] = [];
      for (const file of files) {
        const key = fileKey(file);
        if (seen.has(key)) continue;
        seen.add(key);
        additions.push({
          id: makeId(),
          file,
          inputFormat: normalizeExtension(extensionOf(file)),
          status: "queued",
          progress: 0,
          logLines: [],
        });
      }
      return [...prev, ...additions];
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setJobs((prev) => {
      const removed = prev.find((j) => j.id === id);
      if (removed?.outputUrl) {
        URL.revokeObjectURL(removed.outputUrl);
        urlsRef.current.delete(removed.outputUrl);
      }
      return prev.filter((j) => j.id !== id);
    });
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current.clear();
    setJobs([]);
    setProcessing(false);
  }, []);

  const convertImageJob = useCallback(
    async (job: ConvertJob, outputFormat: string, quality = 92) => {
      const bitmap = await createImageBitmap(job.file);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close?.();
      const mime = IMAGE_MIME[outputFormat];
      if (!mime) throw new Error(`Unsupported image output: ${outputFormat}`);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), mime, quality / 100),
      );
      if (!blob) throw new Error("Image encoding failed");
      const url = URL.createObjectURL(blob);
      urlsRef.current.add(url);
      updateJob(job.id, {
        status: "done",
        progress: 100,
        outputUrl: url,
        outputSize: blob.size,
        outputFormat,
      });
    },
    [updateJob],
  );

  const recompressAll = useCallback(
    async (outputFormat: string, quality: number) => {
      if (processing) return;

      for (const job of jobs) {
        if (job.outputUrl) {
          URL.revokeObjectURL(job.outputUrl);
          urlsRef.current.delete(job.outputUrl);
        }
      }

      cancelledRef.current = false;
      setProcessing(true);

      for (const job of jobs) {
        if (cancelledRef.current) break;
        updateJob(job.id, {
          status: "converting",
          progress: 0,
          logLines: [],
          error: undefined,
          outputUrl: undefined,
          outputSize: undefined,
          outputFormat: undefined,
        });
        try {
          await convertImageJob(job, outputFormat, quality);
        } catch (err) {
          updateJob(job.id, {
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      setProcessing(false);
    },
    [processing, jobs, updateJob, convertImageJob],
  );

  const convertMediaJob = useCallback(
    async (job: ConvertJob, outputFormat: string) => {
      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error("FFmpeg not initialized");

      const inputName = `input-${job.id}.${job.inputFormat}`;
      const outputName = `output-${job.id}.${outputFormat}`;
      let duration = 0;

      const onLog = ({ message }: { message: string }) => {
        if (!duration) {
          const d = parseDuration(message);
          if (d !== null) duration = d;
        }
        const pct = parseProgress(message, duration);
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id !== job.id) return j;
            const logLines =
              j.logLines.length > 400
                ? [...j.logLines.slice(-399), message]
                : [...j.logLines, message];
            return {
              ...j,
              logLines,
              progress: pct !== null ? pct : j.progress,
            };
          }),
        );
      };

      ffmpeg.on("log", onLog);
      try {
        await ffmpeg.writeFile(inputName, await fetchFile(job.file));
        await ffmpeg.exec(["-i", inputName, outputName]);
        const data = await ffmpeg.readFile(outputName);
        const bytes =
          typeof data === "string"
            ? new TextEncoder().encode(data)
            : (data as Uint8Array);
        const blob = new Blob([bytes.buffer as ArrayBuffer]);
        const url = URL.createObjectURL(blob);
        urlsRef.current.add(url);
        updateJob(job.id, {
          status: "done",
          progress: 100,
          outputUrl: url,
          outputSize: blob.size,
          outputFormat,
        });
      } finally {
        ffmpeg.off("log", onLog);
        try {
          await ffmpeg.deleteFile(inputName);
        } catch {}
        try {
          await ffmpeg.deleteFile(outputName);
        } catch {}
      }
    },
    [ffmpegRef, updateJob],
  );

  const convertAll = useCallback(
    async (outputFormat: string, quality?: number) => {
      if (processing) return;
      const isCanvasBased = type === "image" || type === "compress";
      if (!isCanvasBased && !ffmpegLoaded) return;

      cancelledRef.current = false;
      setProcessing(true);

      const pending = jobs.filter(
        (j) => j.status !== "done" && (type === "compress" || j.inputFormat !== outputFormat),
      );

      for (const job of pending) {
        if (cancelledRef.current) break;
        updateJob(job.id, {
          status: "converting",
          progress: 0,
          logLines: [],
          error: undefined,
          outputUrl: undefined,
          outputSize: undefined,
          outputFormat: undefined,
        });
        try {
          if (isCanvasBased) {
            await convertImageJob(job, outputFormat, quality);
          } else {
            await convertMediaJob(job, outputFormat);
          }
        } catch (err) {
          updateJob(job.id, {
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      setProcessing(false);
    },
    [
      processing,
      type,
      ffmpegLoaded,
      jobs,
      updateJob,
      convertImageJob,
      convertMediaJob,
    ],
  );

  return { jobs, processing, addFiles, removeFile, reset, recompressAll, convertAll };
}
