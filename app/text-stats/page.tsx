import type { Metadata } from "next";
import { TextStatsTool } from "@/src/components/TextStatsTool";

export const metadata: Metadata = {
  title: "Text Statistics",
  description: "Analyze text with live word count, character count, reading time, and top word frequency.",
};

export default function TextStatsPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <TextStatsTool />
    </main>
  );
}
