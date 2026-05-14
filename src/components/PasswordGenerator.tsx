"use client";

import { useCallback, useEffect, useState } from "react";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";

function generatePassword(length: number, upper: boolean, lower: boolean, digits: boolean, symbols: boolean): string {
  let chars = "";
  if (upper) chars += UPPER;
  if (lower) chars += LOWER;
  if (digits) chars += DIGITS;
  if (symbols) chars += SYMBOLS;
  if (!chars) chars = LOWER + DIGITS;

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => chars[v % chars.length]).join("");
}

function entropy(length: number, poolSize: number): number {
  return length * Math.log2(poolSize);
}

function strengthLabel(bits: number): { label: string; color: string; width: string } {
  if (bits < 40) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
  if (bits < 60) return { label: "Fair", color: "bg-orange-400", width: "w-2/4" };
  if (bits < 80) return { label: "Strong", color: "bg-amber-400", width: "w-3/4" };
  return { label: "Very strong", color: "bg-emerald-400", width: "w-full" };
}

export function PasswordGenerator() {
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(false);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generate = useCallback(() => {
    setPasswords(Array.from({ length: count }, () => generatePassword(length, upper, lower, digits, symbols)));
  }, [length, upper, lower, digits, symbols, count]);

  useEffect(() => { generate(); }, [generate]);

  const poolSize =
    (upper ? UPPER.length : 0) +
    (lower ? LOWER.length : 0) +
    (digits ? DIGITS.length : 0) +
    (symbols ? SYMBOLS.length : 0) || LOWER.length + DIGITS.length;

  const bits = entropy(length, poolSize);
  const strength = strengthLabel(bits);

  async function copy(text: string, i: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 1500);
  }

  const toggle = (label: string, value: boolean, set: (v: boolean) => void) => (
    <label key={label} className="flex cursor-pointer items-center gap-2 select-none">
      <div
        onClick={() => set(!value)}
        className={`h-5 w-9 rounded-full transition-colors duration-150 ${value ? "bg-amber-400" : "bg-zinc-700"} relative`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span className="text-sm text-zinc-300">{label}</span>
    </label>
  );

  const btnCls = "shrink-0 rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Password Generator</h1>
        <p className="mt-2 text-sm text-zinc-400">Generate cryptographically random passwords.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {/* Length */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Length</span>
            <span className="font-mono text-sm text-amber-400">{length}</span>
          </div>
          <input
            type="range"
            min={6}
            max={128}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-amber-400"
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>6</span><span>128</span>
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2">
          {toggle("Uppercase (A–Z)", upper, setUpper)}
          {toggle("Lowercase (a–z)", lower, setLower)}
          {toggle("Digits (0–9)", digits, setDigits)}
          {toggle("Symbols (!@#…)", symbols, setSymbols)}
        </div>

        {/* Strength */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Strength</span>
            <span className={`font-medium ${strength.color.replace("bg-", "text-")}`}>
              {strength.label} — {Math.round(bits)} bits
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
          </div>
        </div>

        {/* Count + Generate */}
        <div className="flex items-end gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Batch count</label>
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <button
            type="button"
            onClick={generate}
            className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300"
          >
            Regenerate
          </button>
        </div>

        {/* Results */}
        <div className="flex max-h-72 flex-col gap-1 overflow-auto">
          {passwords.map((pw, i) => (
            <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2">
              <span className="break-all font-mono text-sm text-zinc-200">{pw}</span>
              <button type="button" onClick={() => copy(pw, i)} className={btnCls}>
                {copiedIndex === i ? "Copied!" : "Copy"}
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
