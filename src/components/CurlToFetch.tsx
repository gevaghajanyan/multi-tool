"use client";

import { useState } from "react";

function tokenize(input: string): string[] {
  const normalized = input.replace(/\\\n/g, " ").replace(/\s+/g, " ").trim();
  const tokens: string[] = [];
  let i = 0;
  while (i < normalized.length) {
    while (i < normalized.length && normalized[i] === " ") i++;
    if (i >= normalized.length) break;

    let token = "";
    if (normalized[i] === "'") {
      i++;
      while (i < normalized.length && normalized[i] !== "'") {
        if (normalized[i] === "\\" && i + 1 < normalized.length) {
          i++;
          token += normalized[i];
        } else {
          token += normalized[i];
        }
        i++;
      }
      i++;
    } else if (normalized[i] === '"') {
      i++;
      while (i < normalized.length && normalized[i] !== '"') {
        if (normalized[i] === "\\" && i + 1 < normalized.length) {
          i++;
          const c = normalized[i];
          if (c === "n") token += "\n";
          else if (c === "t") token += "\t";
          else token += c;
        } else {
          token += normalized[i];
        }
        i++;
      }
      i++;
    } else {
      while (i < normalized.length && normalized[i] !== " ") {
        if (normalized[i] === "\\" && i + 1 < normalized.length) {
          i++;
          token += normalized[i];
        } else {
          token += normalized[i];
        }
        i++;
      }
    }
    if (token !== "") tokens.push(token);
  }
  return tokens;
}

interface ParsedCurl {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  redirect: boolean;
  insecure: boolean;
  formData: Array<{ name: string; value: string }> | null;
}

function parseCurl(tokens: string[]): ParsedCurl {
  const result: ParsedCurl = {
    url: "",
    method: "",
    headers: {},
    body: null,
    redirect: false,
    insecure: false,
    formData: null,
  };

  let i = 0;
  if (tokens[0]?.toLowerCase() === "curl") i = 1;

  let forceGet = false;

  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "-X" || t === "--request") {
      result.method = tokens[++i] ?? "";
    } else if (t === "-H" || t === "--header") {
      const hdr = tokens[++i] ?? "";
      const colonIdx = hdr.indexOf(":");
      if (colonIdx !== -1) {
        const name = hdr.slice(0, colonIdx).trim();
        const value = hdr.slice(colonIdx + 1).trim();
        result.headers[name] = value;
      }
    } else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-binary") {
      result.body = tokens[++i] ?? "";
    } else if (t === "--json") {
      result.body = tokens[++i] ?? "";
      result.headers["Content-Type"] = "application/json";
      result.headers["Accept"] = "application/json";
      if (!result.method) result.method = "POST";
    } else if (t === "-u" || t === "--user") {
      const creds = tokens[++i] ?? "";
      result.headers["Authorization"] = "Basic " + btoa(creds);
    } else if (t === "--oauth2-bearer") {
      result.headers["Authorization"] = "Bearer " + (tokens[++i] ?? "");
    } else if (t === "--url") {
      result.url = tokens[++i] ?? "";
    } else if (t === "-L" || t === "--location") {
      result.redirect = true;
    } else if (t === "-k" || t === "--insecure") {
      result.insecure = true;
    } else if (t === "-G" || t === "--get") {
      forceGet = true;
    } else if (t === "-F" || t === "--form") {
      const field = tokens[++i] ?? "";
      const eqIdx = field.indexOf("=");
      if (eqIdx !== -1) {
        if (!result.formData) result.formData = [];
        result.formData.push({ name: field.slice(0, eqIdx), value: field.slice(eqIdx + 1) });
      }
    } else if (t === "--compressed") {
    } else if (!t.startsWith("-")) {
      if (!result.url) result.url = t;
    }
    i++;
  }

  if (forceGet) result.method = "GET";
  if (!result.method) result.method = result.body || result.formData ? "POST" : "GET";

  return result;
}

function buildFetch(parsed: ParsedCurl): string {
  const lines: string[] = [];
  if (parsed.insecure) lines.push("// Warning: --insecure flag detected — TLS certificate verification disabled");

  const opts: string[] = [];
  if (parsed.method !== "GET") opts.push(`  method: "${parsed.method}",`);

  if (parsed.body && !parsed.headers["Content-Type"]) {
    const trimmed = parsed.body.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      parsed.headers["Content-Type"] = "application/json";
    }
  }

  const headerEntries = Object.entries(parsed.headers);
  if (headerEntries.length > 0) {
    opts.push("  headers: {");
    for (const [k, v] of headerEntries) {
      opts.push(`    "${k}": "${v}",`);
    }
    opts.push("  },");
  }

  if (parsed.formData) {
    opts.push("  body: (() => {");
    opts.push("    const fd = new FormData();");
    for (const { name, value } of parsed.formData) {
      opts.push(`    fd.append("${name}", "${value}");`);
    }
    opts.push("    return fd;");
    opts.push("  })(),");
  } else if (parsed.body) {
    const trimmed = parsed.body.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const pretty = JSON.stringify(JSON.parse(trimmed), null, 2);
        opts.push(`  body: JSON.stringify(${pretty}),`);
      } catch {
        opts.push(`  body: ${JSON.stringify(parsed.body)},`);
      }
    } else {
      opts.push(`  body: ${JSON.stringify(parsed.body)},`);
    }
  }

  if (parsed.redirect) opts.push(`  redirect: "follow",`);

  let fetchCall: string;
  if (opts.length === 0) {
    fetchCall = `const response = await fetch("${parsed.url}");`;
  } else {
    fetchCall = `const response = await fetch("${parsed.url}", {\n${opts.join("\n")}\n});`;
  }

  lines.push(fetchCall);
  lines.push("const data = await response.json();");

  return lines.join("\n");
}

function convertCurl(raw: string): string {
  const tokens = tokenize(raw);
  if (tokens.length === 0) return "";
  const parsed = parseCurl(tokens);
  if (!parsed.url) return "// Could not extract URL from curl command";
  return buildFetch(parsed);
}

export function CurlToFetch() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function handleConvert() {
    setError("");
    setOutput("");
    try {
      const result = convertCurl(input);
      setOutput(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const btnCls = "rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-100";

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">cURL → Fetch</h1>
        <p className="mt-2 text-sm text-zinc-400">Convert cURL commands to JavaScript fetch() calls.</p>
      </header>

      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-300">cURL Command</span>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setOutput(""); setError(""); }}
            placeholder={"curl -X POST https://api.example.com/users \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"name\": \"Alice\"}'"}
            spellCheck={false}
            className="h-36 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-amber-400/60"
          />
        </div>

        <button
          type="button"
          onClick={handleConvert}
          disabled={!input.trim()}
          className="self-start rounded-xl bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-900 transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Convert
        </button>

        {error && <p className="font-mono text-xs text-red-400">{error}</p>}

        {output && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">fetch() code</span>
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
