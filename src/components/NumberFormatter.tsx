"use client";

import { useState, useMemo } from "react";

const LOCALES = [
  { label: "en-US (English, US)", value: "en-US" },
  { label: "en-GB (English, UK)", value: "en-GB" },
  { label: "de-DE (German)", value: "de-DE" },
  { label: "fr-FR (French)", value: "fr-FR" },
  { label: "ja-JP (Japanese)", value: "ja-JP" },
  { label: "zh-CN (Chinese)", value: "zh-CN" },
  { label: "ar-SA (Arabic)", value: "ar-SA" },
  { label: "es-ES (Spanish)", value: "es-ES" },
  { label: "pt-BR (Portuguese, BR)", value: "pt-BR" },
  { label: "ru-RU (Russian)", value: "ru-RU" },
  { label: "hi-IN (Hindi)", value: "hi-IN" },
  { label: "ko-KR (Korean)", value: "ko-KR" },
];

const ALL_LOCALES = [
  "en-US", "en-GB", "de-DE", "fr-FR", "ja-JP", "zh-CN", "ar-SA",
  "es-ES", "pt-BR", "ru-RU", "hi-IN", "ko-KR", "it-IT", "nl-NL",
  "pl-PL", "sv-SE", "tr-TR", "th-TH", "id-ID", "vi-VN",
];

type StyleType = "decimal" | "currency" | "percent" | "unit";
type NotationType = "standard" | "compact" | "scientific" | "engineering";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CNY", "INR", "KRW", "BRL", "CAD", "AUD", "CHF", "RUB"];
const UNITS = ["kilometer", "meter", "mile", "foot", "kilogram", "gram", "pound", "ounce", "liter", "gallon", "celsius", "fahrenheit"];

function formatNumber(
  value: number,
  locale: string,
  style: StyleType,
  currency: string,
  unit: string,
  notation: NotationType,
  minFraction: number,
  maxFraction: number,
): string {
  try {
    const opts: Intl.NumberFormatOptions = {
      style,
      notation,
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction,
    };
    if (style === "currency") opts.currency = currency;
    if (style === "unit") { opts.unit = unit; opts.unitDisplay = "long"; }
    return new Intl.NumberFormat(locale, opts).format(value);
  } catch {
    return "—";
  }
}

export function NumberFormatter() {
  const [raw, setRaw] = useState("1234567.89");
  const [locale, setLocale] = useState("en-US");
  const [style, setStyle] = useState<StyleType>("decimal");
  const [currency, setCurrency] = useState("USD");
  const [unit, setUnit] = useState("kilometer");
  const [notation, setNotation] = useState<NotationType>("standard");
  const [minFraction, setMinFraction] = useState(0);
  const [maxFraction, setMaxFraction] = useState(2);
  const [copied, setCopied] = useState(false);

  const parsedValue = useMemo(() => {
    const n = parseFloat(raw.replace(/,/g, ""));
    return isNaN(n) ? null : n;
  }, [raw]);

  const result = useMemo(() => {
    if (parsedValue === null) return null;
    return formatNumber(parsedValue, locale, style, currency, unit, notation, minFraction, maxFraction);
  }, [parsedValue, locale, style, currency, unit, notation, minFraction, maxFraction]);

  const allLocaleResults = useMemo(() => {
    if (parsedValue === null) return [];
    return ALL_LOCALES.map((loc) => ({
      locale: loc,
      value: formatNumber(parsedValue, loc, style, currency, unit, notation, minFraction, maxFraction),
    }));
  }, [parsedValue, style, currency, unit, notation, minFraction, maxFraction]);

  async function copyResult() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const inputCls = "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60";
  const selectCls = "w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Number Formatter</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Format numbers with locale, currency, notation, and unit options.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Number</span>
          <input
            type="text"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="1234567.89"
            spellCheck={false}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-300">Locale</span>
            <select value={locale} onChange={(e) => setLocale(e.target.value)} className={selectCls}>
              {LOCALES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-300">Style</span>
            <select value={style} onChange={(e) => setStyle(e.target.value as StyleType)} className={selectCls}>
              <option value="decimal">Decimal</option>
              <option value="currency">Currency</option>
              <option value="percent">Percent</option>
              <option value="unit">Unit</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-300">Notation</span>
            <select value={notation} onChange={(e) => setNotation(e.target.value as NotationType)} className={selectCls}>
              <option value="standard">Standard</option>
              <option value="compact">Compact</option>
              <option value="scientific">Scientific</option>
              <option value="engineering">Engineering</option>
            </select>
          </div>

          {style === "currency" ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">Currency</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          ) : style === "unit" ? (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">Unit</span>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className={selectCls}>
                {UNITS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">Fraction digits</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={minFraction}
                  onChange={(e) => setMinFraction(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400/60"
                  placeholder="min"
                />
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={maxFraction}
                  onChange={(e) => setMaxFraction(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-400/60"
                  placeholder="max"
                />
              </div>
            </div>
          )}
        </div>

        {parsedValue !== null && result !== null ? (
          <>
            <div className="flex items-center justify-between rounded-xl border border-amber-400/50 bg-amber-400/10 px-5 py-4">
              <span className="truncate font-mono text-2xl font-bold text-amber-400">{result}</span>
              <button
                type="button"
                onClick={copyResult}
                className="ml-4 shrink-0 rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-300">All locales</span>
              <div className="flex flex-col gap-1 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                {allLocaleResults.map(({ locale: loc, value }) => (
                  <div key={loc} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-800/50">
                    <span className="text-xs text-zinc-500 w-24 shrink-0">{loc}</span>
                    <span className="font-mono text-sm text-zinc-100 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          raw.trim() !== "" && (
            <p className="font-mono text-xs text-red-400">Enter a valid number to format.</p>
          )
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">All processing runs locally — your data never leaves this tab.</p>
    </div>
  );
}
