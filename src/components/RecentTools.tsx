"use client";

import Link from "next/link";
import { useSettings } from "@/src/context/SettingsContext";
import { ALL_TOOLS } from "@/src/lib/tools";

export function RecentTools() {
  const { settings } = useSettings();

  const items = settings.recentTools
    .map((href) => ALL_TOOLS.find((t) => t.href === href))
    .filter(Boolean) as (typeof ALL_TOOLS)[number][];

  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        Recently Used
      </h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3.5 transition-all duration-150 hover:border-amber-400/40 hover:bg-zinc-800/70"
          >
            <p className="text-sm font-medium text-zinc-200 group-hover:text-zinc-50">
              {tool.label}
            </p>
            <p className="mt-0.5 text-xs text-zinc-600 group-hover:text-zinc-500">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
