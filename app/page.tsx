import Link from "next/link";
import { TOOL_GROUPS } from "@/src/lib/tools";
import { RecentTools } from "@/src/components/RecentTools";

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

        <RecentTools />

        <div className="space-y-8">
          {TOOL_GROUPS.map(({ group, items }) => (
            <section key={group}>
              <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                {group}
              </h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {items.map(({ href, label, description }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-800/70"
                  >
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50">
                      {label}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600 group-hover:text-zinc-500">
                      {description}
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
