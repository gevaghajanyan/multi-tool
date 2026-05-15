import type { Metadata } from "next";
import { SvgToPng } from "@/src/components/SvgToPng";

export const metadata: Metadata = {
  title: "SVG to PNG — Dev Tools",
  description: "Convert SVG files to PNG images directly in your browser.",
};

export default function SvgPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <SvgToPng />
    </main>
  );
}
