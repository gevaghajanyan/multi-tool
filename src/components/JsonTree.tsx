"use client";

import { useState } from "react";

function Primitive({ value }: { value: unknown }) {
  if (value === null) return <span className="text-zinc-500">null</span>;
  if (typeof value === "boolean")
    return <span className="text-sky-400">{String(value)}</span>;
  if (typeof value === "number")
    return <span className="text-amber-400">{String(value)}</span>;
  if (typeof value === "string")
    return <span className="text-emerald-400">"{value}"</span>;
  return null;
}

interface NodeProps {
  value: unknown;
  label?: string;
  comma?: boolean;
  depth: number;
}

function Node({ value, label, comma = false, depth }: NodeProps) {
  const isArr = Array.isArray(value);
  const isObj = typeof value === "object" && value !== null && !isArr;
  const isComplex = isArr || isObj;

  const [open, setOpen] = useState(depth < 2);

  if (!isComplex) {
    return (
      <div className="flex min-w-0 items-baseline gap-1 leading-6">
        {label && (
          <span className="shrink-0 text-zinc-300">{label}</span>
        )}
        <Primitive value={value} />
        {comma && <span className="text-zinc-600">,</span>}
      </div>
    );
  }

  const entries = isArr
    ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(value as Record<string, unknown>);

  const openB = isArr ? "[" : "{";
  const closeB = isArr ? "]" : "}";
  const summary = isArr
    ? `${entries.length} item${entries.length === 1 ? "" : "s"}`
    : `${entries.length} key${entries.length === 1 ? "" : "s"}`;

  if (entries.length === 0) {
    return (
      <div className="flex items-baseline gap-1 leading-6">
        {label && <span className="shrink-0 text-zinc-300">{label}</span>}
        <span className="text-zinc-500">
          {openB}
          {closeB}
        </span>
        {comma && <span className="text-zinc-600">,</span>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center leading-6">
        {label && (
          <span className="mr-1 shrink-0 text-zinc-300">{label}</span>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mr-0.5 w-3 shrink-0 select-none text-center text-xs text-zinc-500 transition-colors hover:text-zinc-200"
        >
          {open ? "▾" : "▸"}
        </button>
        <span className="text-zinc-500">{openB}</span>
        {!open && (
          <>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mx-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
            >
              {summary}
            </button>
            <span className="text-zinc-500">{closeB}</span>
            {comma && <span className="text-zinc-600">,</span>}
          </>
        )}
      </div>

      {open && (
        <>
          <div className="ml-3 border-l border-zinc-800 pl-3">
            {entries.map(([k, v], i) => (
              <Node
                key={k}
                value={v}
                label={isArr ? undefined : `"${k}":`}
                depth={depth + 1}
                comma={i < entries.length - 1}
              />
            ))}
          </div>
          <div className="leading-6">
            <span className="text-zinc-500">{closeB}</span>
            {comma && <span className="text-zinc-600">,</span>}
          </div>
        </>
      )}
    </div>
  );
}

export function JsonTree({ value }: { value: unknown }) {
  return (
    <div className="font-mono text-sm leading-6 text-zinc-100">
      <Node value={value} depth={0} />
    </div>
  );
}
