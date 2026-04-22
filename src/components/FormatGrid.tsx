"use client";

import type { ConverterType } from "@/src/types/converter";
import { FORMATS } from "@/src/utils/formats";

interface Props {
  type: ConverterType;
  disabledFormats: string[];
  selected: string | null;
  onSelect: (format: string) => void;
  disabled?: boolean;
}

export function FormatGrid({
  type,
  disabledFormats,
  selected,
  onSelect,
  disabled,
}: Props) {
  const disabledSet = new Set(disabledFormats);
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-300">Output format</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {FORMATS[type].output.map((fmt) => {
          const isInput = disabledSet.has(fmt);
          const isSelected = fmt === selected;
          const isDisabled = disabled || isInput;
          return (
            <button
              key={fmt}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(fmt)}
              title={isInput ? "Same as an input format" : undefined}
              className={
                "rounded-lg border px-3 py-2 text-sm font-medium uppercase tracking-wide transition-colors duration-150 " +
                (isSelected
                  ? "border-amber-400 bg-amber-400/10 text-amber-400"
                  : isDisabled
                    ? "border-zinc-900 bg-zinc-950 text-zinc-700 cursor-not-allowed"
                    : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100")
              }
            >
              {fmt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
