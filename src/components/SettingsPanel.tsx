"use client";

import { ACCENTS, type AccentKey, useSettings } from "@/src/context/SettingsContext";
import { TOOL_GROUPS } from "@/src/lib/tools";

function PinIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22" />
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function SettingsPanel() {
  const { settings, togglePin, toggleHide, setAccent, reset } = useSettings();

  const pinnedCount = settings.pinnedTools.length;
  const hiddenCount = settings.hiddenTools.length;

  return (
    <div className="w-full max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Settings</h1>
        <p className="mt-2 text-sm text-zinc-400">Customise the navigation and appearance.</p>
      </header>

      <div className="flex flex-col gap-8">
        {/* Accent color */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="mb-1 text-base font-semibold text-zinc-100">Accent color</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Changes the highlight color across the entire app — buttons, active links, focus rings.
          </p>
          <div className="flex flex-wrap gap-3">
            {(Object.entries(ACCENTS) as [AccentKey, typeof ACCENTS[AccentKey]][]).map(([key, def]) => {
              const active = settings.accent === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccent(key)}
                  title={def.label}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    active
                      ? "border-zinc-500 bg-zinc-800 text-zinc-100"
                      : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className="h-4 w-4 rounded-full shadow-sm"
                    style={{ backgroundColor: def.swatch }}
                  />
                  {def.label}
                  {active && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-zinc-400">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Tools */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Tools</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Pin tools to the nav bar or hide ones you never use.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              {pinnedCount > 0 && <span className="text-amber-400">{pinnedCount} pinned</span>}
              {hiddenCount > 0 && <span className="text-red-400">{hiddenCount} hidden</span>}
            </div>
          </div>

          <div className="mb-4 flex items-center gap-6 border-b border-zinc-800 pb-3 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5"><PinIcon active={false} /> Pin to nav</span>
            <span className="flex items-center gap-1.5"><EyeOffIcon /> Hide from menu</span>
          </div>

          <div className="flex flex-col gap-6">
            {TOOL_GROUPS.map(({ group, items }) => (
              <div key={group}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                  {group}
                </p>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {items.map(({ href, label }) => {
                    const pinned = settings.pinnedTools.includes(href);
                    const hidden = settings.hiddenTools.includes(href);
                    return (
                      <div
                        key={href}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors duration-100 ${
                          hidden
                            ? "border-zinc-800 bg-zinc-950 opacity-50"
                            : "border-zinc-800 bg-zinc-900"
                        }`}
                      >
                        <span className={`text-sm ${hidden ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                          {label}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            title={pinned ? "Unpin from nav" : "Pin to nav"}
                            onClick={() => togglePin(href)}
                            className={`rounded-lg p-1.5 transition-colors duration-100 ${
                              pinned
                                ? "text-amber-400 hover:text-amber-300"
                                : "text-zinc-600 hover:text-zinc-300"
                            }`}
                          >
                            <PinIcon active={pinned} />
                          </button>
                          <button
                            type="button"
                            title={hidden ? "Show in menu" : "Hide from menu"}
                            onClick={() => toggleHide(href)}
                            className={`rounded-lg p-1.5 transition-colors duration-100 ${
                              hidden
                                ? "text-red-400 hover:text-red-300"
                                : "text-zinc-600 hover:text-zinc-300"
                            }`}
                          >
                            {hidden ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reset */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            Reset to defaults
          </button>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-zinc-600">
        Settings are saved locally in your browser — nothing is sent anywhere.
      </p>
    </div>
  );
}
