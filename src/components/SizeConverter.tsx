"use client";

import { useCallback, useState } from "react";

type Unit = "px" | "rem" | "em" | "pt" | "vw" | "vh" | "cm" | "mm" | "in";

interface UnitDef {
  key: Unit;
  label: string;
  description: string;
  toPx: (v: number, cfg: Config) => number;
  fromPx: (v: number, cfg: Config) => number;
  decimals: number;
}

interface Config {
  rootFontSize: number;
  emBase: number;
  viewportW: number;
  viewportH: number;
}

const UNIT_DEFS: UnitDef[] = [
  {
    key: "px", label: "px", description: "Pixels",
    toPx: (v) => v,
    fromPx: (v) => v,
    decimals: 3,
  },
  {
    key: "rem", label: "rem", description: "Root em",
    toPx: (v, c) => v * c.rootFontSize,
    fromPx: (v, c) => v / c.rootFontSize,
    decimals: 4,
  },
  {
    key: "em", label: "em", description: "Element em",
    toPx: (v, c) => v * c.emBase,
    fromPx: (v, c) => v / c.emBase,
    decimals: 4,
  },
  {
    key: "pt", label: "pt", description: "Points",
    toPx: (v) => v * (96 / 72),
    fromPx: (v) => v * (72 / 96),
    decimals: 3,
  },
  {
    key: "vw", label: "vw", description: "Viewport width",
    toPx: (v, c) => v * (c.viewportW / 100),
    fromPx: (v, c) => v / (c.viewportW / 100),
    decimals: 4,
  },
  {
    key: "vh", label: "vh", description: "Viewport height",
    toPx: (v, c) => v * (c.viewportH / 100),
    fromPx: (v, c) => v / (c.viewportH / 100),
    decimals: 4,
  },
  {
    key: "cm", label: "cm", description: "Centimetres",
    toPx: (v) => v * (96 / 2.54),
    fromPx: (v) => v * (2.54 / 96),
    decimals: 4,
  },
  {
    key: "mm", label: "mm", description: "Millimetres",
    toPx: (v) => v * (96 / 25.4),
    fromPx: (v) => v * (25.4 / 96),
    decimals: 4,
  },
  {
    key: "in", label: "in", description: "Inches",
    toPx: (v) => v * 96,
    fromPx: (v) => v / 96,
    decimals: 5,
  },
];

const PRESETS = [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96];

function fmt(n: number, decimals: number): string {
  const s = n.toFixed(decimals);
  return parseFloat(s).toString();
}

const DEFAULT_CFG: Config = { rootFontSize: 16, emBase: 16, viewportW: 1440, viewportH: 900 };

export function SizeConverter() {
  const [cfg, setCfg] = useState<Config>(DEFAULT_CFG);
  const [values, setValues] = useState<Record<Unit, string>>({
    px: "16", rem: "1", em: "1", pt: "12", vw: "", vh: "", cm: "", mm: "", in: "",
  });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const syncFromPx = useCallback((px: number, cfg: Config): Record<Unit, string> => {
    const result = {} as Record<Unit, string>;
    for (const def of UNIT_DEFS) {
      result[def.key] = fmt(def.fromPx(px, cfg), def.decimals);
    }
    return result;
  }, []);

  function handleChange(unit: UnitDef, raw: string) {
    if (raw === "" || raw === "-") {
      setValues((prev) => ({ ...prev, [unit.key]: raw }));
      return;
    }
    const n = parseFloat(raw);
    if (isNaN(n)) { setValues((prev) => ({ ...prev, [unit.key]: raw })); return; }
    const px = unit.toPx(n, cfg);
    setValues(syncFromPx(px, cfg));
  }

  function handleCfgChange(key: keyof Config, raw: string) {
    const n = parseFloat(raw);
    if (isNaN(n) || n <= 0) return;
    const newCfg = { ...cfg, [key]: n };
    setCfg(newCfg);
    const px = parseFloat(values.px) || 0;
    if (px) setValues(syncFromPx(px, newCfg));
  }

  function loadPreset(px: number) {
    setValues(syncFromPx(px, cfg));
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";
  const cfgCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 font-mono text-xs text-zinc-100 outline-none transition-colors focus:border-amber-400/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Size Converter</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Convert between px, rem, em, pt, vw, vh, cm, mm, and in.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">

        {/* Config */}
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:grid-cols-4">
          {[
            { key: "rootFontSize" as const, label: "Root font (px)" },
            { key: "emBase" as const, label: "em base (px)" },
            { key: "viewportW" as const, label: "Viewport W (px)" },
            { key: "viewportH" as const, label: "Viewport H (px)" },
          ].map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">{label}</label>
              <input
                type="number"
                value={cfg[key]}
                onChange={(e) => handleCfgChange(key, e.target.value)}
                className={cfgCls}
              />
            </div>
          ))}
        </div>

        {/* Presets */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-600">Quick presets (px)</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((px) => (
              <button
                key={px}
                type="button"
                onClick={() => loadPreset(px)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-mono transition-colors duration-100 ${
                  parseFloat(values.px) === px
                    ? "border-amber-400/40 text-amber-400"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                }`}
              >
                {px}
              </button>
            ))}
          </div>
        </div>

        {/* Unit inputs */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {UNIT_DEFS.map((def) => (
            <div key={def.key} className="flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-zinc-300">{def.label}</span>
                  <span className="text-[10px] text-zinc-600">{def.description}</span>
                </div>
                <input
                  type="number"
                  value={values[def.key]}
                  onChange={(e) => handleChange(def, e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <button
                type="button"
                onClick={() => copy(values[def.key] || "0", def.key)}
                className="mt-4 shrink-0 rounded-lg border border-zinc-700 px-2.5 py-2 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
              >
                {copiedKey === def.key ? "✓" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
