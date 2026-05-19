"use client";

import { useState } from "react";

type Tab = "Format" | "Minify" | "Validate";

function indentXml(doc: Document): string {
  function serialize(node: Node, depth: number): string {
    const indent = "  ".repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim() ?? "";
      return text ? `${indent}${text}\n` : "";
    }
    if (node.nodeType === Node.COMMENT_NODE) {
      return `${indent}<!--${node.textContent}-->\n`;
    }
    if (node.nodeType === Node.DOCUMENT_NODE) {
      return Array.from(node.childNodes).map((c) => serialize(c, depth)).join("");
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      let tag = el.tagName;
      const attrs = Array.from(el.attributes)
        .filter((a) => a.name !== "xmlns" && !a.name.startsWith("xmlns:"))
        .map((a) => ` ${a.name}="${a.value}"`)
        .join("");
      const children = Array.from(el.childNodes);
      const onlyText = children.length === 1 && children[0].nodeType === Node.TEXT_NODE;
      if (children.length === 0) {
        return `${indent}<${tag}${attrs} />\n`;
      }
      if (onlyText) {
        const text = children[0].textContent?.trim() ?? "";
        return `${indent}<${tag}${attrs}>${text}</${tag}>\n`;
      }
      const inner = children.map((c) => serialize(c, depth + 1)).join("");
      return `${indent}<${tag}${attrs}>\n${inner}${indent}</${tag}>\n`;
    }
    if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
      const pi = node as ProcessingInstruction;
      return `${indent}<?${pi.target} ${pi.data}?>\n`;
    }
    return "";
  }
  return serialize(doc, 0).trimEnd();
}

function processXml(input: string, tab: Tab): { output: string; error: string; valid: boolean } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "application/xml");
  const parseError = doc.querySelector("parsererror");

  if (parseError) {
    const msg = parseError.textContent?.replace(/\n+/g, " ").trim() ?? "Invalid XML";
    return { output: "", error: msg, valid: false };
  }

  if (tab === "Validate") {
    return { output: "", error: "", valid: true };
  }

  if (tab === "Format") {
    const formatted = indentXml(doc);
    return { output: formatted, error: "", valid: true };
  }

  const serializer = new XMLSerializer();
  let minified = serializer.serializeToString(doc);
  minified = minified.replace(/xmlns="[^"]*"/g, "").replace(/\s+/g, " ").replace(/> </g, "><").trim();
  return { output: minified, error: "", valid: true };
}

export function XmlFormatter() {
  const [tab, setTab] = useState<Tab>("Format");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [valid, setValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  function handleProcess() {
    if (!input.trim()) return;
    const result = processXml(input, tab);
    setOutput(result.output);
    setError(result.error);
    setValid(result.valid ? true : false);
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const tabs: Tab[] = ["Format", "Minify", "Validate"];
  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">XML Formatter</h1>
        <p className="mt-2 text-sm text-zinc-400">Format, minify, or validate XML documents.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex w-fit gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setOutput(""); setError(""); setValid(null); }}
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
          onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); setValid(null); }}
          placeholder="<root><item>value</item></root>"
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

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {tab === "Validate" && valid === true && !error && (
          <p className="font-mono text-xs text-green-400">Valid XML ✓</p>
        )}

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
