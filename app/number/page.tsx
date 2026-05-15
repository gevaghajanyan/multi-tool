import type { Metadata } from "next";
import { NumberFormatter } from "@/src/components/NumberFormatter";

export const metadata: Metadata = {
  title: "Number Formatter",
  description: "Format numbers with locale, currency, notation, and unit options.",
};

export default function NumberPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <NumberFormatter />
    </main>
  );
}
