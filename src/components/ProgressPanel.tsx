"use client";

import { useEffect, useRef } from "react";

interface Props {
  progress: number;
  logLines: string[];
  showLog?: boolean;
}

export function ProgressPanel({ progress, logLines, showLog = true }: Props) {
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logLines]);

  const pct = Math.round(progress);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
          <span>Progress</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-amber-400 transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {showLog && (
        <div
          ref={logRef}
          className="h-40 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-zinc-400"
        >
          {logLines.length === 0 ? (
            <p className="text-zinc-600">Waiting for FFmpeg output…</p>
          ) : (
            logLines.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">
                {line}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
