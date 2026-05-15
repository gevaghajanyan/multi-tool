"use client";

import { useCallback, useRef, useState } from "react";
import { unzip } from "fflate";

interface ZipEntry {
  path: string;
  isDir: boolean;
  uncompressedSize: number;
  compressedSize: number;
  data: Uint8Array | null;
}

interface ZipStats {
  fileCount: number;
  dirCount: number;
  totalUncompressed: number;
  totalCompressed: number;
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1_048_576).toFixed(2)} MB`;
}

function fmtRatio(compressed: number, uncompressed: number): string {
  if (uncompressed === 0) return "—";
  const ratio = ((1 - compressed / uncompressed) * 100).toFixed(1);
  return `${ratio}%`;
}

function guessContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    json: "application/json",
    txt: "text/plain",
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    ts: "application/typescript",
    xml: "application/xml",
    zip: "application/zip",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
  };
  return map[ext] ?? "application/octet-stream";
}

// Estimate compressed size from a flat fflate decompressed output
// fflate's unzip callback gives decompressed data only; we approximate compressed size
// by checking the original buffer offsets is not possible; we use a rough heuristic.
// For accurate compressed sizes we'd need a ZIP parser. We'll mark them as "—".
// Instead, we use a basic ZIP central directory parser for metadata.

interface ZipFileRecord {
  path: string;
  compressedSize: number;
  uncompressedSize: number;
  isDir: boolean;
}

function parseZipMetadata(buf: Uint8Array): ZipFileRecord[] {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const len = buf.byteLength;

  // Find End of Central Directory signature (0x06054b50)
  let eocdOffset = -1;
  for (let i = len - 22; i >= 0; i--) {
    if (
      view.getUint8(i) === 0x50 &&
      view.getUint8(i + 1) === 0x4b &&
      view.getUint8(i + 2) === 0x05 &&
      view.getUint8(i + 3) === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return [];

  const cdEntries = view.getUint16(eocdOffset + 10, true);
  const cdOffset = view.getUint32(eocdOffset + 16, true);

  const records: ZipFileRecord[] = [];
  let offset = cdOffset;

  for (let i = 0; i < cdEntries; i++) {
    if (offset + 46 > len) break;
    const sig =
      view.getUint8(offset) |
      (view.getUint8(offset + 1) << 8) |
      (view.getUint8(offset + 2) << 16) |
      (view.getUint8(offset + 3) << 24);
    if (sig !== 0x02014b50) break;

    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);

    const nameBytes = buf.slice(offset + 46, offset + 46 + fileNameLen);
    const path = new TextDecoder("utf-8", { fatal: false }).decode(nameBytes);
    const isDir = path.endsWith("/");

    records.push({ path, compressedSize, uncompressedSize, isDir });
    offset += 46 + fileNameLen + extraLen + commentLen;
  }

  return records;
}

export function ZipInspector() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState(0);
  const [entries, setEntries] = useState<ZipEntry[]>([]);
  const [stats, setStats] = useState<ZipStats | null>(null);
  const [error, setError] = useState("");
  const [dropHover, setDropHover] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip") && file.type !== "application/zip") {
      setError("Please select a .zip file.");
      return;
    }

    setError("");
    setEntries([]);
    setStats(null);
    setLoading(true);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buf = new Uint8Array(arrayBuffer);

      // Parse metadata (compressed sizes) from central directory
      const metaRecords = parseZipMetadata(buf);
      const metaMap = new Map<string, ZipFileRecord>();
      for (const r of metaRecords) {
        metaMap.set(r.path, r);
      }

      unzip(buf, (err, files) => {
        setLoading(false);
        if (err) {
          setError(err.message ?? "Failed to parse ZIP file.");
          return;
        }

        const result: ZipEntry[] = [];

        // Add directories from metadata that don't appear as file keys
        for (const [, rec] of metaMap) {
          if (rec.isDir) {
            result.push({
              path: rec.path,
              isDir: true,
              uncompressedSize: 0,
              compressedSize: 0,
              data: null,
            });
          }
        }

        // Add files from fflate output
        for (const [path, data] of Object.entries(files)) {
          const meta = metaMap.get(path);
          result.push({
            path,
            isDir: false,
            uncompressedSize: meta?.uncompressedSize ?? data.byteLength,
            compressedSize: meta?.compressedSize ?? 0,
            data,
          });
        }

        // Sort: dirs first, then files, alphabetically within each group
        result.sort((a, b) => {
          if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
          return a.path.localeCompare(b.path);
        });

        const fileEntries = result.filter((e) => !e.isDir);
        const dirEntries = result.filter((e) => e.isDir);

        const totalUncompressed = fileEntries.reduce((s, e) => s + e.uncompressedSize, 0);
        const totalCompressed = fileEntries.reduce((s, e) => s + e.compressedSize, 0);

        setEntries(result);
        setStats({
          fileCount: fileEntries.length,
          dirCount: dirEntries.length,
          totalUncompressed,
          totalCompressed,
        });
      });
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "Failed to read file.");
    }
  }, []);

  function handleFiles(files: FileList | null) {
    if (files?.[0]) loadFile(files[0]);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDropHover(false);
    handleFiles(e.dataTransfer.files);
  }

  function extractFile(entry: ZipEntry) {
    if (!entry.data) return;
    const blob = new Blob([entry.data.buffer as ArrayBuffer], { type: guessContentType(entry.path) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const name = entry.path.split("/").filter(Boolean).pop() ?? entry.path;
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasFile = fileName !== null;

  const dropCls = `flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-colors cursor-pointer select-none py-12 ${
    dropHover
      ? "border-amber-400/60 bg-amber-400/5"
      : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
  }`;

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">ZIP Inspector</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Inspect and extract files from ZIP archives — nothing is uploaded.
        </p>
      </header>

      <input
        ref={inputRef}
        type="file"
        accept=".zip,application/zip"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        {!hasFile && (
          <div
            className={dropCls}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDropHover(true);
            }}
            onDragLeave={() => setDropHover(false)}
            onDrop={onDrop}
          >
            <svg
              className="h-10 w-10 text-zinc-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M10 2h4v5h-4zM12 7v10M9 10l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-zinc-400">
              Drop a ZIP file here or <span className="text-amber-400">browse</span>
            </p>
            <p className="text-xs text-zinc-600">.zip archives only</p>
          </div>
        )}

        {hasFile && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-200">{fileName}</p>
              <p className="text-xs text-zinc-500">{fmtBytes(fileSize)}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                setEntries([]);
                setStats(null);
                setError("");
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Clear
            </button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            Parsing archive…
          </div>
        )}

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Files", value: String(stats.fileCount) },
              { label: "Folders", value: String(stats.dirCount) },
              {
                label: "Uncompressed",
                value: fmtBytes(stats.totalUncompressed),
              },
              {
                label: "Saved",
                value:
                  stats.totalCompressed > 0
                    ? fmtRatio(stats.totalCompressed, stats.totalUncompressed)
                    : "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
              >
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-0.5 font-mono text-sm font-medium text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-zinc-800">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                      Name
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                      Size
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                      Saved
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {entries.map((entry) => {
                    const depth = entry.path.split("/").filter(Boolean).length - 1;
                    const name =
                      entry.path.split("/").filter(Boolean).pop() ?? entry.path;

                    return (
                      <tr
                        key={entry.path}
                        className="transition-colors hover:bg-zinc-800/30"
                      >
                        <td className="px-4 py-2.5">
                          <div
                            className="flex min-w-0 items-center gap-2"
                            style={{ paddingLeft: depth * 12 }}
                          >
                            {entry.isDir ? (
                              <svg
                                className="h-3.5 w-3.5 shrink-0 text-amber-400"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z" />
                              </svg>
                            ) : (
                              <svg
                                className="h-3.5 w-3.5 shrink-0 text-zinc-500"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              >
                                <path
                                  d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7Z"
                                  strokeLinejoin="round"
                                />
                                <path d="M13 2v7h7" strokeLinejoin="round" />
                              </svg>
                            )}
                            <span
                              className={`min-w-0 truncate font-mono text-xs ${
                                entry.isDir ? "text-amber-400" : "text-zinc-300"
                              }`}
                              title={entry.path}
                            >
                              {name}
                              {entry.isDir ? "/" : ""}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-zinc-400">
                          {entry.isDir ? "—" : fmtBytes(entry.uncompressedSize)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-zinc-500">
                          {entry.isDir || entry.compressedSize === 0
                            ? "—"
                            : fmtRatio(entry.compressedSize, entry.uncompressedSize)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {!entry.isDir && entry.data && (
                            <button
                              type="button"
                              onClick={() => extractFile(entry)}
                              className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
                            >
                              Extract
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
