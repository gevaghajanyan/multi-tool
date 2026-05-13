"use client";

import { useEffect, useState } from "react";

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [Math.round((h / 6) * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  if (sn === 0) { const v = Math.round(ln * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    const tt = ((t % 1) + 1) % 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return [
    Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hn) * 255),
    Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  ];
}

function toHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

export function ColorConverter() {
  const [r, setR] = useState(99);
  const [g, setG] = useState(102);
  const [b, setB] = useState(241);
  const [hexText, setHexText] = useState("#6366f1");
  const [editingHex, setEditingHex] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const hex = toHex(r, g, b);
  const [h, s, l] = rgbToHsl(r, g, b);

  useEffect(() => {
    if (!editingHex) setHexText(hex);
  }, [hex, editingHex]);

  function fromHex(value: string) {
    setHexText(value);
    const parsed = hexToRgb(value);
    if (parsed) { setR(parsed[0]); setG(parsed[1]); setB(parsed[2]); }
  }

  function fromRgb(component: "r" | "g" | "b", raw: string) {
    const v = Math.max(0, Math.min(255, parseInt(raw) || 0));
    if (component === "r") setR(v);
    else if (component === "g") setG(v);
    else setB(v);
  }

  function fromHsl(component: "h" | "s" | "l", raw: string) {
    const max = component === "h" ? 360 : 100;
    const v = Math.max(0, Math.min(max, parseInt(raw) || 0));
    const [rgb] = [hslToRgb(
      component === "h" ? v : h,
      component === "s" ? v : s,
      component === "l" ? v : l,
    )];
    const [nr, ng, nb] = hslToRgb(
      component === "h" ? v : h,
      component === "s" ? v : s,
      component === "l" ? v : l,
    );
    setR(nr); setG(ng); setB(nb);
    void rgb;
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-center font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none";
  const copyBtnCls =
    "shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100";

  return (
    <div className="w-full max-w-md">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
          Color Converter
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Convert between HEX, RGB, and HSL color formats.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Swatch + native picker */}
        <div className="relative h-24 w-full overflow-hidden rounded-xl border border-zinc-700 transition-colors duration-150" style={{ backgroundColor: hex }}>
          <input
            type="color"
            value={hex}
            onChange={(e) => { const p = hexToRgb(e.target.value); if (p) { setR(p[0]); setG(p[1]); setB(p[2]); } }}
            title="Pick a color"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span className="absolute bottom-2 right-3 text-[10px] text-white/50 select-none pointer-events-none">click to pick</span>
        </div>

        {/* HEX */}
        <div className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-sm font-medium text-zinc-400">HEX</span>
          <input
            type="text"
            value={hexText}
            onFocus={() => setEditingHex(true)}
            onBlur={() => { setEditingHex(false); setHexText(hex); }}
            onChange={(e) => fromHex(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
          />
          <button type="button" onClick={() => copy(hex, "hex")} className={copyBtnCls}>
            {copiedKey === "hex" ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* RGB */}
        <div className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-sm font-medium text-zinc-400">RGB</span>
          <div className="flex flex-1 gap-2">
            {(["r", "g", "b"] as const).map((ch, i) => (
              <div key={ch} className="flex flex-1 flex-col gap-0.5">
                <span className="select-none text-center text-[10px] uppercase text-zinc-600">{ch}</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={[r, g, b][i]}
                  onChange={(e) => fromRgb(ch, e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => copy(`rgb(${r}, ${g}, ${b})`, "rgb")} className={copyBtnCls}>
            {copiedKey === "rgb" ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* HSL */}
        <div className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-sm font-medium text-zinc-400">HSL</span>
          <div className="flex flex-1 gap-2">
            {([
              { label: "H", value: h, component: "h" as const },
              { label: "S", value: s, component: "s" as const },
              { label: "L", value: l, component: "l" as const },
            ]).map(({ label, value, component }) => (
              <div key={label} className="flex flex-1 flex-col gap-0.5">
                <span className="select-none text-center text-[10px] uppercase text-zinc-600">{label}</span>
                <input
                  type="number"
                  min={0}
                  max={component === "h" ? 360 : 100}
                  value={value}
                  onChange={(e) => fromHsl(component, e.target.value)}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => copy(`hsl(${h}, ${s}%, ${l}%)`, "hsl")} className={copyBtnCls}>
            {copiedKey === "hsl" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
