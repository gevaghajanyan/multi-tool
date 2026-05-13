"use client";

import { useMemo, useState } from "react";
import { diffLines, type Change } from "diff";

type Row = { id: string; ln: number | null; rn: number | null; type: "add" | "del" | "ctx"; text: string };

function buildRows(changes: Change[]): Row[] {
  const rows: Row[] = [];
  let ln = 1, rn = 1, idx = 0;
  for (const change of changes) {
    const lines = change.value.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    for (const text of lines) {
      if (change.added) {
        rows.push({ id: `${idx++}`, ln: null, rn: rn++, type: "add", text });
      } else if (change.removed) {
        rows.push({ id: `${idx++}`, ln: ln++, rn: null, type: "del", text });
      } else {
        rows.push({ id: `${idx++}`, ln: ln++, rn: rn++, type: "ctx", text });
      }
    }
  }
  return rows;
}

function DiffTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full border-collapse font-mono text-xs">
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={
              row.type === "add"
                ? "bg-emerald-950/60"
                : row.type === "del"
                ? "bg-red-950/60"
                : ""
            }
          >
            <td className="w-10 select-none border-r border-zinc-800 px-2 py-0.5 text-right text-zinc-600">
              {row.ln ?? ""}
            </td>
            <td className="w-10 select-none border-r border-zinc-800 px-2 py-0.5 text-right text-zinc-600">
              {row.rn ?? ""}
            </td>
            <td className="w-5 select-none px-1 py-0.5 text-center">
              {row.type === "add" ? (
                <span className="text-emerald-400">+</span>
              ) : row.type === "del" ? (
                <span className="text-red-400">−</span>
              ) : null}
            </td>
            <td className="whitespace-pre-wrap break-all px-2 py-0.5 text-zinc-200">{row.text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TextDiff() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [maximized, setMaximized] = useState(false);

  const { rows, stats } = useMemo(() => {
    if (!left && !right) return { rows: [], stats: null };
    const changes = diffLines(left, right, { newlineIsToken: false });
    const r = buildRows(changes);
    const added = r.filter((x) => x.type === "add").length;
    const removed = r.filter((x) => x.type === "del").length;
    return { rows: r, stats: { added, removed } };
  }, [left, right]);

  const hasChanges = rows.length > 0;

  const textareaCls =
    "h-48 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60";

  const diffPanel = hasChanges ? (
    <div className="overflow-auto rounded-xl border border-zinc-800 bg-zinc-950">
      <DiffTable rows={rows} />
    </div>
  ) : null;

  return (
    <>
      <div className="w-full max-w-4xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Text Diff</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Compare two blocks of text line by line.
          </p>
        </header>

        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Original</span>
              <textarea
                value={left}
                onChange={(e) => setLeft(e.target.value)}
                placeholder="Paste original text…"
                spellCheck={false}
                className={textareaCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-300">Modified</span>
              <textarea
                value={right}
                onChange={(e) => setRight(e.target.value)}
                placeholder="Paste modified text…"
                spellCheck={false}
                className={textareaCls}
              />
            </div>
          </div>

          {hasChanges && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs">
                  {stats && stats.added > 0 && (
                    <span className="text-emerald-400">+{stats.added} added</span>
                  )}
                  {stats && stats.removed > 0 && (
                    <span className="text-red-400">−{stats.removed} removed</span>
                  )}
                  {stats && stats.added === 0 && stats.removed === 0 && (
                    <span className="text-zinc-500">No differences</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMaximized(true)}
                  className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  Expand
                </button>
              </div>
              <div className="max-h-80 overflow-auto rounded-xl border border-zinc-800 bg-zinc-950">
                <DiffTable rows={rows} />
              </div>
            </div>
          )}

          {!hasChanges && (left || right) && (
            <p className="text-center text-sm text-zinc-500">No differences</p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          All processing runs locally — your data never leaves this tab.
        </p>
      </div>

      {maximized && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div className="flex gap-3 text-xs">
              {stats && stats.added > 0 && <span className="text-emerald-400">+{stats.added} added</span>}
              {stats && stats.removed > 0 && <span className="text-red-400">−{stats.removed} removed</span>}
            </div>
            <button
              type="button"
              onClick={() => setMaximized(false)}
              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-auto">{diffPanel}</div>
        </div>
      )}
    </>
  );
}
