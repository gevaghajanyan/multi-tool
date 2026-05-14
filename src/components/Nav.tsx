"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/src/context/SettingsContext";
import { ALL_TOOLS, TOOL_GROUPS } from "@/src/lib/tools";
import { CommandPalette } from "@/src/components/CommandPalette";

function GearIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const { settings, toggleTheme, trackRecent } = useSettings();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  // Close menus + track recent tool on navigation
  useEffect(() => {
    setOpen(false);
    setMobileOpen(false);
    if (ALL_TOOLS.some((t) => t.href === pathname)) {
      trackRecent(pathname);
    }
  }, [pathname, trackRecent]);

  // Cmd+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const pinnedItems = settings.pinnedTools
    .map((href) => ALL_TOOLS.find((t) => t.href === href))
    .filter(Boolean) as { href: string; label: string }[];

  const dropdownGroups = TOOL_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (t) => !settings.pinnedTools.includes(t.href) && !settings.hiddenTools.includes(t.href),
    ),
  })).filter((g) => g.items.length > 0);

  const hasDropdownItems = dropdownGroups.length > 0;

  const dropdownActive =
    hasDropdownItems &&
    ALL_TOOLS.some((t) => t.href === pathname) &&
    !settings.pinnedTools.includes(pathname);

  const linkCls = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
      active ? "text-amber-400" : "text-zinc-400 hover:text-zinc-100"
    }`;

  return (
    <>
      <nav className="border-b border-zinc-800 bg-zinc-950 px-4">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-1">

          {/* Home — always visible */}
          <Link href="/" className={linkCls(pathname === "/")}>Home</Link>

          {/* ── Desktop-only: pinned tools + Tools dropdown ── */}
          <div className="hidden sm:contents">
            {pinnedItems.length > 0 && <div className="mx-1 h-5 w-px bg-zinc-700" />}

            {pinnedItems.map(({ href, label }) => (
              <Link key={href} href={href} className={linkCls(pathname === href)}>
                {label}
              </Link>
            ))}

            {pinnedItems.length > 0 && hasDropdownItems && (
              <div className="mx-2 h-5 w-px bg-zinc-700" />
            )}

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
                  <div className="absolute left-0 top-full z-50 mt-1 w-[min(520px,calc(100vw-2rem))] rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl">
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
          </div>

          {/* Right side: search + theme + settings (desktop) + hamburger (mobile) */}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              title="Search tools (⌘K)"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
            >
              <SearchIcon />
              <span className="hidden text-zinc-600 sm:inline text-xs">⌘K</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              title={settings.theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
            >
              {settings.theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            {/* Settings — desktop only */}
            <Link
              href="/settings"
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                pathname === "/settings" ? "text-amber-400" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              <GearIcon />
              Settings
            </Link>
            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="sm:hidden rounded-lg p-1.5 text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-40 flex flex-col">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel — slides under the nav */}
          <div className="relative mt-12 max-h-[calc(100dvh-3rem)] overflow-y-auto border-b border-zinc-800 bg-zinc-950 shadow-2xl">
            <div className="p-4 space-y-5">
              {/* Pinned tools */}
              {pinnedItems.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Pinned</p>
                  <div className="flex flex-col gap-0.5">
                    {pinnedItems.map(({ href, label }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-100 ${
                          pathname === href ? "bg-zinc-800 text-amber-400" : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* All tool groups */}
              {TOOL_GROUPS.map(({ group, items }) => {
                const visible = items.filter((t) => !settings.hiddenTools.includes(t.href));
                if (!visible.length) return null;
                return (
                  <div key={group}>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                      {group}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      {visible.map(({ href, label }) => (
                        <Link
                          key={href}
                          href={href}
                          className={`rounded-lg px-3 py-2.5 text-sm transition-colors duration-100 ${
                            pathname === href ? "bg-zinc-800 text-amber-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                          }`}
                        >
                          {label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Settings */}
              <div className="border-t border-zinc-800 pt-4">
                <Link
                  href="/settings"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-100 ${
                    pathname === "/settings" ? "text-amber-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                  }`}
                >
                  <GearIcon />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
