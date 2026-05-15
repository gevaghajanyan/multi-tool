"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type initSqlJs from "sql.js";

type SqlJsStatic = Awaited<ReturnType<typeof initSqlJs>>;
type Database = ReturnType<SqlJsStatic["Database"]["prototype"]["constructor"]>;

interface QueryResult {
  columns: string[];
  values: unknown[][];
}

interface HistoryEntry {
  sql: string;
  ts: number;
}

interface TableSchema {
  name: string;
  columns: { name: string; type: string }[];
}

const SAMPLE_SQL = `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, age INTEGER);
INSERT INTO users VALUES (1,'Alice','alice@example.com',30),(2,'Bob','bob@example.com',25),(3,'Carol','carol@example.com',35);
CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product TEXT, amount REAL, created_at TEXT);
INSERT INTO orders VALUES (1,1,'Widget A',29.99,'2024-01-15'),(2,1,'Widget B',49.99,'2024-02-20'),(3,2,'Gadget X',99.99,'2024-03-01'),(4,3,'Widget A',29.99,'2024-03-10');`;

const INITIAL_QUERY = `SELECT u.name, u.email, COUNT(o.id) AS order_count, SUM(o.amount) AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id
ORDER BY total_spent DESC;`;

export function SqlitePlayground() {
  const dbRef = useRef<Database | null>(null);
  const SqlRef = useRef<SqlJsStatic | null>(null);

  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState("");
  const [sql, setSql] = useState(INITIAL_QUERY);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState("");
  const [execMs, setExecMs] = useState<number | null>(null);
  const [affectedRows, setAffectedRows] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(true);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [running, setRunning] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSchema = useCallback(() => {
    if (!dbRef.current) return;
    try {
      const tablesRes = dbRef.current.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
      );
      if (!tablesRes.length) { setSchema([]); return; }
      const tables: TableSchema[] = tablesRes[0].values.map((row: unknown[]) => {
        const tname = row[0] as string;
        let columns: { name: string; type: string }[] = [];
        try {
          const colRes = dbRef.current.exec(`PRAGMA table_info("${tname}");`);
          if (colRes.length) {
            columns = colRes[0].values.map((c: unknown[]) => ({
              name: c[1] as string,
              type: (c[2] as string) || "ANY",
            }));
          }
        } catch {
          // ignore pragma errors
        }
        return { name: tname, columns };
      });
      setSchema(tables);
    } catch {
      // ignore schema refresh errors
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const initSqlJs = (await import("sql.js")).default;
        const SQL = await initSqlJs({ locateFile: () => "/sql-wasm.wasm" });
        SqlRef.current = SQL;
        const db = new SQL.Database();
        dbRef.current = db;
        db.run(SAMPLE_SQL);
        refreshSchema();
        setReady(true);
      } catch (e) {
        setInitError(e instanceof Error ? e.message : "Failed to initialize sql.js");
      }
    }
    init();
  }, [refreshSchema]);

  const runQuery = useCallback(() => {
    if (!dbRef.current || !sql.trim()) return;
    setRunning(true);
    setError("");
    setResults([]);
    setAffectedRows(null);
    setExecMs(null);

    try {
      const start = performance.now();
      const res = dbRef.current.exec(sql);
      const elapsed = performance.now() - start;
      setExecMs(Math.round(elapsed * 100) / 100);

      if (res.length > 0) {
        setResults(res as QueryResult[]);
        setAffectedRows(null);
      } else {
        setResults([]);
        const affected = dbRef.current.getRowsModified();
        setAffectedRows(affected);
      }

      refreshSchema();

      setHistory((prev) => {
        const entry: HistoryEntry = { sql: sql.trim(), ts: Date.now() };
        const filtered = prev.filter((h) => h.sql !== sql.trim());
        return [entry, ...filtered].slice(0, 10);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query error");
    } finally {
      setRunning(false);
    }
  }, [sql, refreshSchema]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runQuery();
      }
    },
    [runQuery]
  );

  const handleFileLoad = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !SqlRef.current) return;
      try {
        const buf = await file.arrayBuffer();
        const db = new SqlRef.current.Database(new Uint8Array(buf));
        dbRef.current = db;
        setFileName(file.name);
        setResults([]);
        setError("");
        setAffectedRows(null);
        setExecMs(null);
        refreshSchema();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load database file");
      }
      e.target.value = "";
    },
    [refreshSchema]
  );

  const handleExport = useCallback(() => {
    if (!dbRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = dbRef.current.export();
    const blob = new Blob([data as BlobPart], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ?? "database.sqlite";
    a.click();
    URL.revokeObjectURL(url);
  }, [fileName]);

  const resetDatabase = useCallback(() => {
    if (!SqlRef.current) return;
    const db = new SqlRef.current.Database();
    dbRef.current = db;
    db.run(SAMPLE_SQL);
    setFileName(null);
    setResults([]);
    setError("");
    setAffectedRows(null);
    setExecMs(null);
    refreshSchema();
  }, [refreshSchema]);

  if (initError) {
    return (
      <div className="w-full max-w-4xl">
        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <p className="font-mono text-xs text-red-400">Failed to load sql.js: {initError}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="w-full max-w-4xl">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 shadow-xl">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
          <p className="text-sm text-zinc-500">Loading SQLite engine…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">SQLite Playground</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Run SQL queries in the browser — powered by an in-memory SQLite database.
        </p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">

        {/* Toolbar row */}
        <div className="flex flex-wrap items-center gap-2">
          {fileName && (
            <span className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-2 py-1 font-mono text-xs text-amber-400">
              {fileName}
            </span>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
          >
            Load .sqlite / .db
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".sqlite,.db,.sqlite3"
            className="hidden"
            onChange={handleFileLoad}
          />
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
          >
            Export .sqlite
          </button>
          <button
            type="button"
            onClick={resetDatabase}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
          >
            Reset sample data
          </button>
        </div>

        {/* Main area: schema + editor */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Schema panel */}
          <div className="flex flex-col gap-2 sm:w-52 sm:shrink-0">
            <button
              type="button"
              onClick={() => setSchemaOpen((v) => !v)}
              className="flex items-center justify-between rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
            >
              <span className="font-medium text-zinc-300">Schema</span>
              <span className="text-zinc-600">{schemaOpen ? "▲" : "▼"}</span>
            </button>

            {schemaOpen && (
              <div className="flex flex-col gap-2 rounded-xl border border-zinc-700 bg-zinc-900 p-3">
                {schema.length === 0 ? (
                  <p className="text-xs text-zinc-600">No tables found.</p>
                ) : (
                  schema.map((table) => (
                    <div key={table.name}>
                      <p className="text-xs font-semibold text-amber-400">{table.name}</p>
                      <ul className="mt-1 space-y-0.5">
                        {table.columns.map((col) => (
                          <li key={col.name} className="flex items-baseline gap-1">
                            <span className="font-mono text-xs text-zinc-300">{col.name}</span>
                            <span className="font-mono text-[10px] text-zinc-600">{col.type}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* SQL Editor */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500">SQL Editor</span>
              <span className="text-xs text-zinc-600">Ctrl+Enter to run</span>
            </div>
            <textarea
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              placeholder="SELECT * FROM users;"
              className="h-32 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={runQuery}
                disabled={running || !sql.trim()}
                className="rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {running ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-400" />
                    Running…
                  </span>
                ) : (
                  "Run"
                )}
              </button>
              {execMs !== null && (
                <span className="text-xs text-zinc-500">
                  Completed in{" "}
                  <span className="text-amber-400">{execMs} ms</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-3">
            <p className="font-mono text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {!error && results.length === 0 && affectedRows === null && execMs !== null && (
          <p className="text-xs text-zinc-500">Query executed successfully with no output.</p>
        )}

        {affectedRows !== null && (
          <p className="text-xs text-zinc-400">
            <span className="text-amber-400 font-semibold">{affectedRows}</span>{" "}
            {affectedRows === 1 ? "row" : "rows"} affected.
          </p>
        )}

        {results.map((res, idx) => (
          <div key={idx} className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-800">
                <tr>
                  {res.columns.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.values.length === 0 ? (
                  <tr>
                    <td
                      colSpan={res.columns.length}
                      className="px-3 py-4 text-center font-mono text-xs text-zinc-600"
                    >
                      No rows returned.
                    </td>
                  </tr>
                ) : (
                  res.values.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-zinc-800/30">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-3 py-2 font-mono text-xs text-zinc-300 border-b border-zinc-800/50"
                        >
                          {cell === null ? (
                            <span className="text-zinc-600 italic">NULL</span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <p className="px-3 py-1.5 text-right text-xs text-zinc-600">
              {res.values.length} {res.values.length === 1 ? "row" : "rows"}
            </p>
          </div>
        ))}

        {/* Query History */}
        {history.length > 0 && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex items-center justify-between rounded-lg border border-zinc-700 px-3 py-1.5 text-xs transition-colors duration-150 hover:text-zinc-100"
            >
              <span className="font-medium text-zinc-300">Query History</span>
              <span className="text-zinc-600">{historyOpen ? "▲" : "▼"}</span>
            </button>
            {historyOpen && (
              <ul className="flex flex-col gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-2">
                {history.map((entry, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setSql(entry.sql)}
                      className="w-full rounded-lg px-3 py-1.5 text-left font-mono text-xs text-zinc-400 transition-colors duration-150 hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <span className="line-clamp-1">{entry.sql}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally in your browser — your data never leaves this tab.
      </p>
    </div>
  );
}
