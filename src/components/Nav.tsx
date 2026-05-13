"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PRIMARY = [
  { href: "/", label: "File Converter" },
  { href: "/json", label: "JSON Tools" },
];

const TOOLS: { group: string; items: { href: string; label: string }[] }[] = [
  {
    group: "Encoding",
    items: [
      { href: "/base64", label: "Base64" },
      { href: "/html", label: "HTML Entities" },
      { href: "/hash", label: "Hash Generator" },
    ],
  },
  {
    group: "Auth & Tokens",
    items: [
      { href: "/jwt", label: "JWT Decoder" },
      { href: "/jwt-builder", label: "JWT Builder" },
      { href: "/password", label: "Password Generator" },
      { href: "/uuid", label: "UUID Generator" },
    ],
  },
  {
    group: "Data",
    items: [
      { href: "/csv", label: "CSV ↔ JSON" },
      { href: "/url", label: "URL Parser" },
      { href: "/timestamp", label: "Timestamp" },
      { href: "/base", label: "Base Converter" },
      { href: "/color", label: "Color Converter" },
    ],
  },
  {
    group: "Text & Code",
    items: [
      { href: "/regex", label: "Regex Tester" },
      { href: "/diff", label: "Text Diff" },
      { href: "/cron", label: "Cron Parser" },
      { href: "/case", label: "String Case" },
      { href: "/markdown", label: "Markdown Preview" },
      { href: "/lorem", label: "Lorem Ipsum" },
    ],
  },
];

const ALL_TOOL_HREFS = TOOLS.flatMap((g) => g.items.map((i) => i.href));

export function Nav() {
  const pathname = usePathname();
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

  const toolActive = ALL_TOOL_HREFS.includes(pathname);

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-4">
      <div className="mx-auto flex h-12 max-w-7xl items-center gap-1">
        {/* Primary links */}
        {PRIMARY.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              pathname === href
                ? "text-amber-400"
                : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {label}
          </Link>
        ))}

        {/* Divider */}
        <div className="mx-3 h-5 w-px bg-zinc-700" />

        {/* Tools dropdown */}
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              toolActive || open ? "text-amber-400" : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            Tools
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
              className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 w-[520px] rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {TOOLS.map(({ group, items }) => (
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
      </div>
    </nav>
  );
}
