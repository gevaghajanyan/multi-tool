import type { Metadata } from "next";
import { CsvConverter } from "@/src/components/CsvConverter";

export const metadata: Metadata = {
  title: "CSV ↔ JSON — File Converter",
  description: "Convert between CSV and JSON array formats.",
};

export default function CsvPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      <CsvConverter />
    </main>
  );
}
