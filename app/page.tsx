import Link from "next/link";
import { TOOL_GROUPS } from "@/src/lib/tools";

const TOOL_DESCRIPTIONS: Record<string, string> = {
  "/files": "Convert video, audio & images",
  "/json": "Format & validate JSON",
  "/base64": "Encode & decode Base64",
  "/html": "HTML entity encode/decode",
  "/hash": "Generate MD5, SHA hashes",
  "/jwt": "Decode & inspect JWTs",
  "/jwt-builder": "Create signed JWTs",
  "/password": "Generate secure passwords",
  "/uuid": "Generate UUIDs",
  "/csv": "Convert between CSV & JSON",
  "/url": "Parse & analyze URLs",
  "/timestamp": "Convert timestamps & dates",
  "/base": "Convert between number bases",
  "/color": "Convert color formats",
  "/size": "Convert size units",
  "/regex": "Test regular expressions",
  "/diff": "Compare text differences",
  "/cron": "Parse cron expressions",
  "/case": "Convert string cases",
  "/markdown": "Preview Markdown live",
  "/lorem": "Generate placeholder text",
};

export default function Home() {
  return (
    <main className="min-h-dvh bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Dev Tools</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Browser-based developer utilities — no data leaves your machine
          </p>
        </div>

        <div className="space-y-8">
          {TOOL_GROUPS.map(({ group, items }) => (
            <section key={group}>
              <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                {group}
              </h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {items.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-800/70"
                  >
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50">
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600 group-hover:text-zinc-500">
                      {TOOL_DESCRIPTIONS[href] ?? ""}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
