"use client";

import { useState } from "react";

type Base = "dec" | "hex" | "bin" | "oct";

interface Field {
  key: Base;
  label: string;
  prefix: string;
  radix: number;
  pattern: RegExp;
}

const FIELDS: Field[] = [
  { key: "dec", label: "Decimal", prefix: "", radix: 10, pattern: /^-?\d*$/ },
  { key: "hex", label: "Hexadecimal", prefix: "0x", radix: 16, pattern: /^[0-9a-fA-F]*$/ },
  { key: "bin", label: "Binary", prefix: "0b", radix: 2, pattern: /^[01]*$/ },
  { key: "oct", label: "Octal", prefix: "0o", radix: 8, pattern: /^[0-7]*$/ },
];

const ZERO = BigInt(0);

function toDisplay(n: bigint, radix: number): string {
  if (radix === 10) return n.toString();
  const abs = n < ZERO ? -n : n;
  const s = abs.toString(radix);
  return n < ZERO ? `-${s}` : s;
}

function parse(raw: string, radix: number): bigint | null {
  if (!raw || raw === "-") return null;
  try {
    const neg = raw.startsWith("-");
    const digits = neg ? raw.slice(1) : raw;
    if (!digits) return null;
    const val = BigInt(radix === 10 ? (neg ? `-${digits}` : digits) : `0${radix === 16 ? "x" : radix === 2 ? "b" : "o"}${digits}`);
    return val;
  } catch {
    return null;
  }
}

export function BaseConverter() {
  const [values, setValues] = useState<Record<Base, string>>({ dec: "", hex: "", bin: "", oct: "" });
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function handleChange(field: Field, raw: string) {
    if (raw !== "" && raw !== "-" && !field.pattern.test(raw.replace(/^-/, ""))) return;
    const n = parse(raw, field.radix);
    if (n === null) {
      setValues({
        dec: field.key === "dec" ? raw : "",
        hex: field.key === "hex" ? raw : "",
        bin: field.key === "bin" ? raw : "",
        oct: field.key === "oct" ? raw : "",
      });
      return;
    }
    setValues({
      dec: toDisplay(n, 10),
      hex: toDisplay(n, 16),
      bin: toDisplay(n, 2),
      oct: toDisplay(n, 8),
    });
  }

  function clear() {
    setValues({ dec: "", hex: "", bin: "", oct: "" });
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  const btnCls = "shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-lg">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Base Converter</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Convert numbers between decimal, hex, binary, and octal.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex justify-end">
          <button type="button" onClick={clear} className="text-xs text-zinc-500 transition-colors hover:text-zinc-300">
            Clear
          </button>
        </div>

        {FIELDS.map((field) => (
          <div key={field.key} className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-300">{field.label}</span>
            <div className="flex items-center gap-2">
              {field.prefix && (
                <span className="shrink-0 font-mono text-sm text-zinc-600">{field.prefix}</span>
              )}
              <input
                type="text"
                value={values[field.key]}
                onChange={(e) => handleChange(field, e.target.value)}
                placeholder="0"
                spellCheck={false}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
              />
              <button
                type="button"
                onClick={() => copy(values[field.key] || "0", field.key)}
                className={btnCls}
              >
                {copiedKey === field.key ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
