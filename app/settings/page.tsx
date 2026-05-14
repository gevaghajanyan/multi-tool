import type { Metadata } from "next";
import { SettingsPanel } from "@/src/components/SettingsPanel";

export const metadata: Metadata = {
  title: "Settings — Dev Tools",
  description: "Customise navigation and appearance.",
};

export default function SettingsPage() {
  return (
    <main className="flex min-h-dvh flex-1 justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <SettingsPanel />
    </main>
  );
}
