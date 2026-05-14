"use client";

import { useMemo, useState } from "react";

// ─── Type inference ───────────────────────────────────────────────────────────

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

function toPascalCase(s: string): string {
  if (!s) return "Root";
  return s
    .replace(/[^a-zA-Z0-9]+([a-zA-Z0-9])/g, (_, c: string) => c.toUpperCase())
    .replace(/^[a-z0-9]/, (c: string) => c.toUpperCase());
}

function singularize(name: string): string {
  if (/ies$/i.test(name)) return name.replace(/ies$/i, "y");
  if (/[^s]s$/i.test(name)) return name.slice(0, -1);
  return name + "Item";
}

function generate(json: JsonValue, rootName: string): string {
  const defs: string[] = [];
  const usedNames = new Set<string>();

  function uniqueName(base: string): string {
    const b = toPascalCase(base) || "Obj";
    if (!usedNames.has(b)) { usedNames.add(b); return b; }
    let i = 2;
    while (usedNames.has(`${b}${i}`)) i++;
    const n = `${b}${i}`;
    usedNames.add(n);
    return n;
  }

  function buildInterface(
    name: string,
    entries: [string, { types: string[]; optional: boolean }][],
  ): void {
    if (entries.length === 0) { defs.push(`interface ${name} {}`); return; }
    const lines = entries.map(([key, { types, optional }]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      const unique = [...new Set(types)];
      const typeStr = unique.length === 1 ? unique[0] : unique.join(" | ");
      return `  ${safeKey}${optional ? "?" : ""}: ${typeStr};`;
    });
    defs.push(`interface ${name} {\n${lines.join("\n")}\n}`);
  }

  function inferType(value: JsonValue, hint: string): string {
    if (value === null) return "null";
    if (typeof value === "string") return "string";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";

    if (Array.isArray(value)) {
      if (value.length === 0) return "unknown[]";

      const objItems = value.filter(
        (v): v is Record<string, JsonValue> =>
          v !== null && typeof v === "object" && !Array.isArray(v),
      );

      if (objItems.length === value.length) {
        // All elements are objects — merge into a single interface
        const elemName = uniqueName(singularize(hint));
        const fieldCounts = new Map<string, { types: string[]; count: number }>();
        for (const item of objItems) {
          for (const [k, v] of Object.entries(item)) {
            if (!fieldCounts.has(k)) fieldCounts.set(k, { types: [], count: 0 });
            const entry = fieldCounts.get(k)!;
            entry.count++;
            entry.types.push(inferType(v, k));
          }
        }
        const entries: [string, { types: string[]; optional: boolean }][] = [];
        for (const [k, { types, count }] of fieldCounts) {
          entries.push([k, { types, optional: count < objItems.length }]);
        }
        buildInterface(elemName, entries);
        return `${elemName}[]`;
      }

      // Mixed array
      const types = [...new Set(value.map((v) => inferType(v as JsonValue, hint)))];
      const elementType = types.length === 1 ? types[0] : `(${types.join(" | ")})`;
      return `${elementType}[]`;
    }

    if (typeof value === "object") {
      const name = uniqueName(hint);
      const entries: [string, { types: string[]; optional: boolean }][] = Object.entries(
        value as Record<string, JsonValue>,
      ).map(([k, v]) => [k, { types: [inferType(v, k)], optional: false }]);
      buildInterface(name, entries);
      return name;
    }

    return "unknown";
  }

  const rn = rootName.trim() || "Root";
  const rootType = inferType(json, rn);
  const rootPascal = toPascalCase(rn);

  // If root wasn't turned into a named interface (primitive, array, …), add a type alias
  if (!usedNames.has(rootPascal)) {
    defs.push(`type ${rootPascal} = ${rootType};`);
  }

  return defs.join("\n\n");
}

// ─── Component ────────────────────────────────────────────────────────────────

const EXAMPLE = `{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "verified": true,
  "score": 9.5,
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "zip": "12345"
  },
  "tags": ["admin", "user"],
  "posts": [
    { "id": 1, "title": "Hello world", "published": true },
    { "id": 2, "title": "Second post", "published": false }
  ]
}`;

export function JsonToTs() {
  const [input, setInput]       = useState("");
  const [rootName, setRootName] = useState("Root");
  const [copied, setCopied]     = useState(false);

  const { output, error } = useMemo<{ output: string; error: string | null }>(() => {
    const trimmed = input.trim();
    if (!trimmed) return { output: "", error: null };
    try {
      const json = JSON.parse(trimmed) as JsonValue;
      return { output: generate(json, rootName), error: null };
    } catch (e) {
      return { output: "", error: (e as Error).message };
    }
  }, [input, rootName]);

  async function copy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="w-full max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">JSON → TypeScript</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Generate TypeScript interfaces from any JSON value.
        </p>
      </header>

      {/* Options bar */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500">Root type name</label>
          <input
            type="text"
            value={rootName}
            onChange={(e) => setRootName(e.target.value)}
            placeholder="Root"
            className="w-36 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 font-mono text-sm text-zinc-100 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>
        <button
          type="button"
          onClick={() => setInput(EXAMPLE)}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100"
        >
          Load example
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* ── Input ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">JSON Input</label>
            {input && (
              <button
                type="button"
                onClick={() => setInput("")}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={'{\n  "key": "value"\n}'}
            spellCheck={false}
            className="h-96 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* ── Output ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-300">TypeScript Types</label>
            <button
              type="button"
              onClick={copy}
              disabled={!output}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Generated TypeScript will appear here…"
            spellCheck={false}
            className="h-96 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-sm text-zinc-300 placeholder-zinc-600 outline-none"
          />
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
