"use client";

import { useMemo, useState } from "react";

function tokenize(input: string): string[] {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[-_./]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase());
}

function toCamel(words: string[]) {
  return words.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1))).join("");
}
function toPascal(words: string[]) {
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
}
function toSnake(words: string[]) { return words.join("_"); }
function toScreamingSnake(words: string[]) { return words.join("_").toUpperCase(); }
function toKebab(words: string[]) { return words.join("-"); }
function toDotCase(words: string[]) { return words.join("."); }
function toTitle(words: string[]) { return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" "); }
function toSentence(words: string[]) {
  const joined = words.join(" ");
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}
function toFlat(words: string[]) { return words.join(""); }
function toCobol(words: string[]) { return words.join("-").toUpperCase(); }

const CASES = [
  { label: "camelCase", fn: toCamel },
  { label: "PascalCase", fn: toPascal },
  { label: "snake_case", fn: toSnake },
  { label: "SCREAMING_SNAKE", fn: toScreamingSnake },
  { label: "kebab-case", fn: toKebab },
  { label: "COBOL-CASE", fn: toCobol },
  { label: "dot.case", fn: toDotCase },
  { label: "Title Case", fn: toTitle },
  { label: "Sentence case", fn: toSentence },
  { label: "flatcase", fn: toFlat },
];

export function StringCaseConverter() {
  const [input, setInput] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const words = useMemo(() => tokenize(input), [input]);
  const results = useMemo(
    () => CASES.map(({ label, fn }) => ({ label, value: words.length ? fn(words) : "" })),
    [words],
  );

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  const btnCls = "shrink-0 rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">String Case</h1>
        <p className="mt-2 text-sm text-zinc-400">Convert text between all common naming conventions.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">Input</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="my variable name or myVariableName"
            spellCheck={false}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        {words.length > 0 && (
          <div className="flex flex-col gap-2">
            {results.map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">{label}</p>
                  <p className="mt-0.5 truncate font-mono text-sm text-zinc-100">{value}</p>
                </div>
                <button type="button" onClick={() => copy(value, label)} className={btnCls}>
                  {copiedKey === label ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
