import type { Metadata } from "next";
import { PdfTools } from "@/src/components/PdfTools";

export const metadata: Metadata = {
  title: "PDF Tools — Dev Tools",
  description: "Inspect, merge, and split PDF files in the browser.",
};

export default function PdfPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <PdfTools />
    </main>
  );
}
