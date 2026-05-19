"use client";

import { useState } from "react";

type Tab = "Format" | "Minify";

const KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "EXISTS", "BETWEEN", "LIKE",
  "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
  "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN", "JOIN",
  "ON", "AS", "DISTINCT", "CASE", "WHEN", "THEN", "ELSE", "END",
  "UNION ALL", "UNION", "EXCEPT", "INTERSECT",
  "WITH", "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
  "CREATE TABLE", "ALTER TABLE", "DROP TABLE",
];

const CLAUSE_BREAKS = [
  "SELECT", "FROM", "WHERE", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
  "INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN", "CROSS JOIN", "JOIN",
  "UNION ALL", "UNION", "EXCEPT", "INTERSECT",
  "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
];

function uppercaseKeywords(sql: string): string {
  const sorted = [...KEYWORDS].sort((a, b) => b.length - a.length);
  for (const kw of sorted) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    sql = sql.replace(new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "gi"), kw);
  }
  return sql;
}

function formatSql(raw: string): string {
  let sql = raw.replace(/\s+/g, " ").trim();
  sql = uppercaseKeywords(sql);

  const clauseRe = CLAUSE_BREAKS
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  sql = sql.replace(new RegExp(`(?<![\\w])(${clauseRe})(?![\\w])`, "g"), "\n$1");

  const lines = sql.split("\n").map((l) => l.trim()).filter(Boolean);
  const result: string[] = [];

  for (const line of lines) {
    if (/^(AND|OR)\b/.test(line)) {
      result.push("  " + line);
    } else {
      const clause = CLAUSE_BREAKS.find((c) => line.startsWith(c));
      if (clause) {
        const rest = line.slice(clause.length).trim();
        if (!rest) {
          result.push(line);
          continue;
        }
        let depth = 0;
        let current = "";
        const items: string[] = [];
        for (const ch of rest) {
          if (ch === "(") { depth++; current += ch; }
          else if (ch === ")") { depth--; current += ch; }
          else if (ch === "," && depth === 0) {
            items.push(current.trim());
            current = "";
          } else {
            current += ch;
          }
        }
        if (current.trim()) items.push(current.trim());

        if (items.length <= 1) {
          result.push(line);
        } else {
          result.push(clause);
          for (let i = 0; i < items.length; i++) {
            result.push("  " + items[i] + (i < items.length - 1 ? "," : ""));
          }
        }
      } else {
        result.push(line);
      }
    }
  }

  return result.join("\n").trim();
}

function minifySql(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function SqlFormatter() {
  const [tab, setTab] = useState<Tab>("Format");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  function handleProcess() {
    if (!input.trim()) return;
    setOutput(tab === "Format" ? formatSql(input) : minifySql(input));
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const tabs: Tab[] = ["Format", "Minify"];
  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">SQL Formatter</h1>
        <p className="mt-2 text-sm text-zinc-400">Format or minify SQL queries with keyword uppercasing.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setOutput(""); }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? "bg-amber-400 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <textarea
          value={input}
          onChange={(e) => { setInput(e.target.value); setOutput(""); }}
          placeholder="select id, name from users where active = 1 and age > 18 order by name"
          spellCheck={false}
          className="h-36 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
        />

        <button
          type="button"
          onClick={handleProcess}
          disabled={!input.trim()}
          className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {tab}
        </button>

        {output && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Output</span>
              <button type="button" onClick={handleCopy} className={btnCls}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              className="h-60 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 font-mono text-sm text-zinc-100 outline-none"
            />
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">All processing runs locally — your data never leaves this tab.</p>
    </div>
  );
}
