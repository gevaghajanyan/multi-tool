"use client";

import type { ConvertJob } from "@/src/types/converter";
import { formatBytes } from "@/src/utils/formatBytes";

interface Props {
  job: ConvertJob;
  onRemove: () => void;
  disabled?: boolean;
}

const STATUS_STYLES: Record<ConvertJob["status"], string> = {
  queued: "bg-zinc-800 text-zinc-300",
  converting: "bg-amber-400/20 text-amber-300",
  done: "bg-emerald-500/15 text-emerald-400",
  error: "bg-red-500/15 text-red-400",
};

const STATUS_LABEL: Record<ConvertJob["status"], string> = {
  queued: "Queued",
  converting: "Converting",
  done: "Done",
  error: "Error",
};

export function FileInfo({ job, onRemove, disabled }: Props) {
  const ext = job.inputFormat || "?";
  const outputName =
    job.outputFormat
      ? job.file.name.replace(/\.[^.]+$/, "") + "." + job.outputFormat
      : job.file.name;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
      <span className="inline-flex items-center rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
        {ext}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-zinc-100">{job.file.name}</p>
        <p className="text-xs text-zinc-500">
          {formatBytes(job.file.size)}
          {job.outputSize !== undefined && job.status === "done"
            ? ` → ${formatBytes(job.outputSize)}`
            : ""}
          {job.status === "converting" && job.progress > 0
            ? ` · ${Math.round(job.progress)}%`
            : ""}
          {job.status === "error" && job.error ? ` · ${job.error}` : ""}
        </p>
      </div>
      <span
        className={
          "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium " +
          STATUS_STYLES[job.status]
        }
      >
        {STATUS_LABEL[job.status]}
      </span>
      {job.status === "done" && job.outputUrl && (
        <a
          href={job.outputUrl}
          download={outputName}
          className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-400 transition-colors duration-150 hover:bg-amber-400/20"
        >
          Download
        </a>
      )}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove file"
        className="rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
      >
        ✕
      </button>
    </div>
  );
}
