"use client";

import { useMemo, useState } from "react";

const WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum pellentesque habitant morbi tristique senectus netus malesuada fames ac turpis egestas vestibulum tortor quam feugiat viverra nibh erat eros libero tincidunt vulputate convallis nisl pretium lacinia mi augue fringilla metus purus aliquet rhoncus arcu eget tellus porta gravida aenean luctus".split(" ");

function word(rng: () => number) {
  return WORDS[Math.floor(rng() * WORDS.length)];
}

function sentence(rng: () => number): string {
  const len = 6 + Math.floor(rng() * 12);
  const words = Array.from({ length: len }, () => word(rng));
  return words[0].charAt(0).toUpperCase() + words[0].slice(1) + " " + words.slice(1).join(" ") + ".";
}

function paragraph(rng: () => number): string {
  const count = 3 + Math.floor(rng() * 4);
  return Array.from({ length: count }, () => sentence(rng)).join(" ");
}

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

type OutputType = "words" | "sentences" | "paragraphs";
type Format = "plain" | "html";

export function LoremIpsum() {
  const [type, setType] = useState<OutputType>("paragraphs");
  const [count, setCount] = useState(3);
  const [format, setFormat] = useState<Format>("plain");
  const [seed, setSeed] = useState(42);
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    const rng = makeRng(seed);
    let text = "";
    if (type === "words") {
      text = Array.from({ length: count }, () => word(rng)).join(" ");
    } else if (type === "sentences") {
      text = Array.from({ length: count }, () => sentence(rng)).join(" ");
    } else {
      const paras = Array.from({ length: count }, () => paragraph(rng));
      text = format === "html" ? paras.map((p) => `<p>${p}</p>`).join("\n") : paras.join("\n\n");
    }
    return text;
  }, [type, count, format, seed]);

  async function copy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";
  const pill = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${active ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`;

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Lorem Ipsum</h1>
        <p className="mt-2 text-sm text-zinc-400">Generate placeholder text in seconds.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-wrap items-center gap-4">
          {/* Type */}
          <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            {(["words", "sentences", "paragraphs"] as OutputType[]).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={pill(type === t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Format (only for paragraphs) */}
          {type === "paragraphs" && (
            <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
              {(["plain", "html"] as Format[]).map((f) => (
                <button key={f} type="button" onClick={() => setFormat(f)} className={pill(format === f)}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium text-zinc-300">Count</span>
            <input
              type="number"
              min={1}
              max={type === "words" ? 500 : type === "sentences" ? 50 : 20}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-100 outline-none focus:border-amber-400/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setSeed((s) => s + 1)}
            className="mt-5 rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300"
          >
            Regenerate
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Output</span>
            <button type="button" onClick={copy} className={btnCls}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="max-h-72 w-full overflow-auto whitespace-pre-wrap rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-300">
            {output}
          </pre>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
