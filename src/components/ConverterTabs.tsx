"use client";

import type { ConverterType } from "@/src/types/converter";

const TABS: { key: ConverterType; label: string }[] = [
  { key: "video", label: "Video" },
  { key: "audio", label: "Audio" },
  { key: "image", label: "Image" },
];

interface Props {
  active: ConverterType;
  onChange: (type: ConverterType) => void;
  disabled?: boolean;
}

export function ConverterTabs({ active, onChange, disabled }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Converter type"
      className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1"
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(t.key)}
            className={
              "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 " +
              (isActive
                ? "bg-amber-400 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-100 disabled:opacity-40 disabled:hover:text-zinc-400")
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
