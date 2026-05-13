"use client";

interface Props {
  quality: number;
  onChange: (q: number) => void;
  disabled?: boolean;
}

export function QualitySlider({ quality, onChange, disabled }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-300">Quality</p>
        <span className="text-sm font-semibold text-amber-400">{quality}%</span>
      </div>
      <input
        type="range"
        min={1}
        max={100}
        value={quality}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-400 disabled:opacity-40"
      />
      <div className="mt-1 flex justify-between text-xs text-zinc-600">
        <span>Smaller file</span>
        <span>Higher quality</span>
      </div>
      <p className="mt-2 text-xs text-zinc-600">
        Quality affects JPEG and WebP. PNG is always lossless.
      </p>
    </div>
  );
}
