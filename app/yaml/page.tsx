import type { Metadata } from "next";
import { YamlConverter } from "@/src/components/YamlConverter";

export const metadata: Metadata = {
  title: "YAML ↔ JSON",
  description: "Convert between YAML and JSON instantly in your browser.",
};

export default function YamlPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 text-zinc-100 sm:py-16">
      <YamlConverter />
    </main>
  );
}
