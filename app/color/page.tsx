import type { Metadata } from "next";
import { ColorConverter } from "@/src/components/ColorConverter";

export const metadata: Metadata = {
  title: "Color Converter — File Converter",
  description: "Convert between HEX, RGB, and HSL color formats.",
};

export default function ColorPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <ColorConverter />
    </main>
  );
}
