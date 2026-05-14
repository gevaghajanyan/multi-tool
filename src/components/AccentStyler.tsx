"use client";

import { useEffect } from "react";
import { ACCENTS } from "@/src/context/SettingsContext";
import { useSettings } from "@/src/context/SettingsContext";

export function AccentStyler() {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const accent = ACCENTS[settings.accent];
    root.style.setProperty("--color-amber-400", accent["400"]);
    root.style.setProperty("--color-amber-300", accent["300"]);
  }, [settings.accent]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
  }, [settings.theme]);

  return null;
}
