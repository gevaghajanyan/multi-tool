"use client";

import { useState } from "react";
import yaml from "js-yaml";

async function copy(text: string, set: (v: boolean) => void) {
  await navigator.clipboard.writeText(text);
  set(true);
  setTimeout(() => set(false), 1500);
}

const textareaCls =
  "h-80 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-amber-400/60";

const btnCls =
  "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 hover:border-zinc-600 hover:text-zinc-100";

export function YamlConverter() {
  const [jsonText, setJsonText] = useState("");
  const [yamlText, setYamlText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [yamlError, setYamlError] = useState("");
  const [jsonCopied, setJsonCopied] = useState(false);
  const [yamlCopied, setYamlCopied] = useState(false);

  function handleJsonChange(value: string) {
    setJsonText(value);
    setJsonError("");
    if (!value.trim()) { setYamlText(""); return; }
    try {
      const obj = JSON.parse(value);
      setYamlText(yaml.dump(obj, { indent: 2, lineWidth: -1 }));
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  function handleYamlChange(value: string) {
    setYamlText(value);
    setYamlError("");
    if (!value.trim()) { setJsonText(""); return; }
    try {
      const obj = yaml.load(value);
      setJsonText(JSON.stringify(obj, null, 2));
    } catch (e) {
      setYamlError(e instanceof Error ? e.message : "Invalid YAML");
    }
  }

  function formatJson() {
    if (!jsonText.trim()) return;
    try {
      setJsonText(JSON.stringify(JSON.parse(jsonText), null, 2));
      setJsonError("");
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }

  return (
    <div className="w-full max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">YAML ↔ JSON</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Paste in either side — the other updates instantly.
        </p>
      </header>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">

          {/* JSON panel */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">JSON</span>
              <div className="flex gap-2">
                <button type="button" onClick={formatJson} disabled={!jsonText.trim()} className={btnCls}>
                  Format
                </button>
                <button type="button" onClick={() => copy(jsonText, setJsonCopied)} disabled={!jsonText.trim()} className={btnCls}>
                  {jsonCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              placeholder={'{\n  "key": "value"\n}'}
              spellCheck={false}
              className={textareaCls}
            />
            {jsonError && (
              <p className="font-mono text-xs text-red-400">{jsonError}</p>
            )}
          </div>

          {/* YAML panel */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">YAML</span>
              <button type="button" onClick={() => copy(yamlText, setYamlCopied)} disabled={!yamlText.trim()} className={btnCls}>
                {yamlCopied ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              value={yamlText}
              onChange={(e) => handleYamlChange(e.target.value)}
              placeholder={"key: value"}
              spellCheck={false}
              className={textareaCls}
            />
            {yamlError && (
              <p className="font-mono text-xs text-red-400">{yamlError}</p>
            )}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        All processing runs locally — your data never leaves this tab.
      </p>
    </div>
  );
}
