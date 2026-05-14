import type { Metadata } from "next";
import { ChmodCalculator } from "@/src/components/ChmodCalculator";

export const metadata: Metadata = {
  title: "Chmod Calculator — Dev Tools",
  description: "Build Unix file permissions visually or type an octal value.",
};

export default function ChmodPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 text-zinc-100 sm:py-16">
      <ChmodCalculator />
    </main>
  );
}
