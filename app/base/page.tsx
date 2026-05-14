import type { Metadata } from "next";
import { BaseConverter } from "@/src/components/BaseConverter";

export const metadata: Metadata = {
  title: "Base Converter — File Converter",
  description: "Convert numbers between decimal, hex, binary, and octal.",
};

export default function BasePage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <BaseConverter />
    </main>
  );
}
