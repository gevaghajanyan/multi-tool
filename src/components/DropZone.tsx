"use client";

import { useRef } from "react";
import type { ConverterType } from "@/src/types/converter";
import { acceptFor, extensionOf, normalizeExtension } from "@/src/utils/formats";
import { FORMATS } from "@/src/utils/formats";
import { useFileDrop } from "@/src/hooks/useFileDrop";

interface Props {
  type: ConverterType;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function DropZone({ type, onFiles, disabled, compact }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const filterValid = (files: File[]) =>
    files.filter((f) =>
      FORMATS[type].input.includes(normalizeExtension(extensionOf(f))),
    );

  const { dragOver, dropHandlers } = useFileDrop((files) => {
    if (disabled) return;
    const valid = filterValid(files);
    if (valid.length) onFiles(valid);
  });

  return (
    <div
      {...dropHandlers}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      aria-disabled={disabled}
      className={
        "flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed text-center transition-colors duration-150 cursor-pointer select-none " +
        (compact ? "px-4 py-6 " : "px-6 py-16 ") +
        (disabled
          ? "border-zinc-900 bg-zinc-950 text-zinc-600 cursor-not-allowed"
          : dragOver
            ? "border-amber-400 bg-amber-400/5 text-zinc-100"
            : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300")
      }
    >
      <p className={compact ? "text-sm font-medium text-zinc-100" : "text-base font-medium text-zinc-100"}>
        {compact ? `Add more ${type} files` : `Drop your ${type} files here`}
      </p>
      {!compact && (
        <>
          <p className="mt-1 text-sm text-zinc-500">or click to browse (multiple supported)</p>
          <p className="mt-4 text-xs text-zinc-600">
            Supported: {FORMATS[type].input.join(", ")}
          </p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptFor(type)}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          const valid = filterValid(files);
          if (valid.length) onFiles(valid);
          e.target.value = "";
        }}
      />
    </div>
  );
}
