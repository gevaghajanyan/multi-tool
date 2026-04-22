"use client";

interface Props {
  disabled: boolean;
  busy: boolean;
  onClick: () => void;
  label?: string;
}

export function ConvertButton({ disabled, busy, onClick, label }: Props) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className={
        "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors duration-150 " +
        (disabled || busy
          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
          : "bg-amber-400 text-zinc-950 hover:bg-amber-500")
      }
    >
      {busy && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950"
        />
      )}
      {busy ? "Converting…" : (label ?? "Convert")}
    </button>
  );
}
