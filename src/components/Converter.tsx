"use client";

import { useMemo, useState } from "react";
import { ConverterTabs } from "./ConverterTabs";
import { DropZone } from "./DropZone";
import { FileInfo } from "./FileInfo";
import { FormatGrid } from "./FormatGrid";
import { ConvertButton } from "./ConvertButton";
import { ProgressPanel } from "./ProgressPanel";
import { useFFmpeg } from "@/src/hooks/useFFmpeg";
import { useConverter } from "@/src/hooks/useConverter";
import type { ConverterType } from "@/src/types/converter";
import { FORMATS } from "@/src/utils/formats";

export function Converter() {
  const [type, setType] = useState<ConverterType>("video");
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const { loaded: ffmpegLoaded, error: ffmpegError, ffmpegRef } = useFFmpeg();
  const { jobs, processing, addFiles, removeFile, reset, convertAll } =
    useConverter({ type, ffmpegRef, ffmpegLoaded });

  const inputFormats = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.inputFormat))),
    [jobs],
  );

  const outputFormat = useMemo(() => {
    if (!selectedFormat) return null;
    if (!FORMATS[type].output.includes(selectedFormat)) return null;
    if (inputFormats.includes(selectedFormat)) return null;
    return selectedFormat;
  }, [selectedFormat, type, inputFormats]);

  const handleTypeChange = (next: ConverterType) => {
    if (processing) return;
    setType(next);
    setSelectedFormat(null);
    reset();
  };

  const handleClearAll = () => {
    if (processing) return;
    reset();
    setSelectedFormat(null);
  };

  const needsFFmpeg = type !== "image";
  const ffmpegLoading = needsFFmpeg && !ffmpegLoaded && !ffmpegError;

  const convertibleCount = jobs.filter(
    (j) => j.status !== "done" && outputFormat && j.inputFormat !== outputFormat,
  ).length;

  const canConvert =
    convertibleCount > 0 &&
    !!outputFormat &&
    !processing &&
    (!needsFFmpeg || ffmpegLoaded);

  const currentJob = jobs.find((j) => j.status === "converting");
  const allDone = jobs.length > 0 && jobs.every((j) => j.status === "done");
  const doneCount = jobs.filter((j) => j.status === "done").length;

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          File Converter
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Convert video, audio, and images — entirely in your browser.
        </p>
      </header>

      <div className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <ConverterTabs
            active={type}
            onChange={handleTypeChange}
            disabled={processing}
          />
          {needsFFmpeg && (
            <span className="text-xs text-zinc-500">
              {ffmpegError
                ? "FFmpeg failed to load"
                : ffmpegLoaded
                  ? "FFmpeg ready"
                  : "Loading FFmpeg…"}
            </span>
          )}
        </div>

        {ffmpegError && needsFFmpeg && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {ffmpegError}
          </div>
        )}

        {jobs.length === 0 ? (
          <DropZone
            type={type}
            onFiles={addFiles}
            disabled={ffmpegLoading}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-zinc-300">
                {jobs.length} file{jobs.length === 1 ? "" : "s"}
                {doneCount > 0 ? ` · ${doneCount} done` : ""}
              </p>
              <button
                type="button"
                onClick={handleClearAll}
                disabled={processing}
                className="text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100 disabled:opacity-40"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {jobs.map((job) => (
                <FileInfo
                  key={job.id}
                  job={job}
                  onRemove={() => removeFile(job.id)}
                  disabled={processing}
                />
              ))}
            </div>
            <DropZone
              type={type}
              onFiles={addFiles}
              disabled={processing || ffmpegLoading}
              compact
            />
          </div>
        )}

        {jobs.length > 0 && (
          <FormatGrid
            type={type}
            disabledFormats={inputFormats}
            selected={outputFormat}
            onSelect={setSelectedFormat}
            disabled={processing}
          />
        )}

        {processing && currentJob && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-zinc-500">
              Converting <span className="text-zinc-300">{currentJob.file.name}</span>
            </p>
            <ProgressPanel
              progress={currentJob.progress}
              logLines={currentJob.logLines}
              showLog={type !== "image"}
            />
          </div>
        )}

        {allDone ? (
          <div className="rounded-xl border border-amber-400/40 bg-amber-400/5 p-4">
            <p className="text-sm font-semibold text-amber-400">
              All {jobs.length} file{jobs.length === 1 ? "" : "s"} converted
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Use the Download button on each file above to save the result.
            </p>
            <button
              type="button"
              onClick={handleClearAll}
              className="mt-3 inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors duration-150 hover:border-zinc-700 hover:text-zinc-100"
            >
              Convert more files
            </button>
          </div>
        ) : (
          jobs.length > 0 && (
            <ConvertButton
              disabled={!canConvert}
              busy={processing}
              onClick={() => outputFormat && convertAll(outputFormat)}
              label={
                ffmpegLoading
                  ? "Loading FFmpeg…"
                  : outputFormat
                    ? `Convert ${convertibleCount} file${convertibleCount === 1 ? "" : "s"} to ${outputFormat.toUpperCase()}`
                    : "Pick an output format"
              }
            />
          )
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All conversions run locally — your files never leave this tab.
      </p>
    </div>
  );
}
