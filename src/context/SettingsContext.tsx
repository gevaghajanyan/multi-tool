"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type AccentKey = "amber" | "indigo" | "emerald" | "rose" | "sky" | "violet";

export interface AccentDef {
  label: string;
  swatch: string;
  "400": string;
  "300": string;
}

export const ACCENTS: Record<AccentKey, AccentDef> = {
  amber:   { label: "Amber",   swatch: "#fbbf24", "400": "#fbbf24", "300": "#fcd34d" },
  indigo:  { label: "Indigo",  swatch: "#818cf8", "400": "#818cf8", "300": "#a5b4fc" },
  emerald: { label: "Emerald", swatch: "#34d399", "400": "#34d399", "300": "#6ee7b7" },
  rose:    { label: "Rose",    swatch: "#fb7185", "400": "#fb7185", "300": "#fda4af" },
  sky:     { label: "Sky",     swatch: "#38bdf8", "400": "#38bdf8", "300": "#7dd3fc" },
  violet:  { label: "Violet",  swatch: "#a78bfa", "400": "#a78bfa", "300": "#c4b5fd" },
};

export interface Settings {
  pinnedTools: string[];
  hiddenTools: string[];
  accent: AccentKey;
  theme: "dark" | "light";
  recentTools: string[];
}

const DEFAULTS: Settings = {
  pinnedTools: ["/files", "/json"],
  hiddenTools: [],
  accent: "amber",
  theme: "dark",
  recentTools: [],
};

const STORAGE_KEY = "devtools-settings-v2";

const MAX_RECENT = 6;

interface SettingsCtx {
  settings: Settings;
  togglePin: (href: string) => void;
  toggleHide: (href: string) => void;
  setAccent: (key: AccentKey) => void;
  toggleTheme: () => void;
  trackRecent: (href: string) => void;
  reset: () => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

function persist(s: Settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const update = useCallback((fn: (prev: Settings) => Settings) => {
    setSettings((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
  }, []);

  const togglePin = useCallback((href: string) => {
    update((prev) => {
      const isPinned = prev.pinnedTools.includes(href);
      return {
        ...prev,
        pinnedTools: isPinned
          ? prev.pinnedTools.filter((h) => h !== href)
          : [...prev.pinnedTools, href],
        hiddenTools: isPinned ? prev.hiddenTools : prev.hiddenTools.filter((h) => h !== href),
      };
    });
  }, [update]);

  const toggleHide = useCallback((href: string) => {
    update((prev) => {
      const isHidden = prev.hiddenTools.includes(href);
      return {
        ...prev,
        hiddenTools: isHidden
          ? prev.hiddenTools.filter((h) => h !== href)
          : [...prev.hiddenTools, href],
        pinnedTools: isHidden ? prev.pinnedTools : prev.pinnedTools.filter((h) => h !== href),
      };
    });
  }, [update]);

  const setAccent = useCallback((key: AccentKey) => {
    update((prev) => ({ ...prev, accent: key }));
  }, [update]);

  const toggleTheme = useCallback(() => {
    update((prev) => ({ ...prev, theme: prev.theme === "dark" ? "light" : "dark" }));
  }, [update]);

  const trackRecent = useCallback((href: string) => {
    update((prev) => ({
      ...prev,
      recentTools: [href, ...prev.recentTools.filter((h) => h !== href)].slice(0, MAX_RECENT),
    }));
  }, [update]);

  const reset = useCallback(() => {
    setSettings(DEFAULTS);
    persist(DEFAULTS);
  }, []);

  return (
    <Ctx.Provider value={{ settings, togglePin, toggleHide, setAccent, toggleTheme, trackRecent, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
