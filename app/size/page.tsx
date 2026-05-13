import type { Metadata } from "next";
import { SizeConverter } from "@/src/components/SizeConverter";

export const metadata: Metadata = {
  title: "Size Converter — Dev Tools",
  description: "Convert between px, rem, em, pt, vw, vh, cm, mm, and in.",
};

export default function SizePage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      <SizeConverter />
    </main>
  );
}
