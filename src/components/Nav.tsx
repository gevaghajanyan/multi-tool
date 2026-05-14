"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/src/context/SettingsContext";
import { ALL_TOOLS, TOOL_GROUPS } from "@/src/lib/tools";

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  // All tools in order, resolved from the pinned hrefs list
  const pinnedItems = settings.pinnedTools
    .map((href) => ALL_TOOLS.find((t) => t.href === href))
    .filter(Boolean) as { href: string; label: string }[];

  // Dropdown: non-pinned, non-hidden tools, grouped
  const dropdownGroups = TOOL_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (t) => !settings.pinnedTools.includes(t.href) && !settings.hiddenTools.includes(t.href),
    ),
  })).filter((g) => g.items.length > 0);

  const hasDropdownItems = dropdownGroups.length > 0;

  // Highlight "Tools" button when on a tool page that lives in the dropdown
  const dropdownActive =
    hasDropdownItems &&
    ALL_TOOLS.some((t) => t.href === pathname) &&
    !settings.pinnedTools.includes(pathname);

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-4">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-1">

        {/* Home link — always visible */}
        <Link
          href="/"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
            pathname === "/" ? "text-amber-400" : "text-zinc-400 hover:text-zinc-100"
          }`}
        >
          Home
        </Link>

        {pinnedItems.length > 0 && (
          <div className="mx-1 h-5 w-px bg-zinc-700" />
        )}

        {/* Pinned tools — fully settings-driven */}
        {pinnedItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              pathname === href ? "text-amber-400" : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {label}
          </Link>
        ))}

        {/* Divider — only when there are pinned items AND dropdown items */}
        {pinnedItems.length > 0 && hasDropdownItems && (
          <div className="mx-2 h-5 w-px bg-zinc-700" />
        )}

        {/* Tools dropdown */}
        {hasDropdownItems && (
          <div ref={ref} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                dropdownActive || open ? "text-amber-400" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              Tools
              <svg
                width="12" height="12" viewBox="0 0 12 12"
                className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {open && (
              <div className="absolute left-0 top-full z-50 mt-1 w-[520px] rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {dropdownGroups.map(({ group, items }) => (
                    <div key={group}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                        {group}
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {items.map(({ href, label }) => (
                          <Link
                            key={href}
                            href={href}
                            className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors duration-100 ${
                              pathname === href
                                ? "bg-zinc-800 text-amber-400"
                                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                            }`}
                          >
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings — always far right */}
        <div className="ml-auto">
          <Link
            href="/settings"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              pathname === "/settings" ? "text-amber-400" : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            <GearIcon />
            Settings
          </Link>
        </div>
      </div>
    </nav>
  );
}
