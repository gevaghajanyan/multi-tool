import type { Metadata } from "next";
import { StringCaseConverter } from "@/src/components/StringCaseConverter";

export const metadata: Metadata = {
  title: "String Case — File Converter",
  description: "Convert text between all common naming conventions.",
};

export default function CasePage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <StringCaseConverter />
    </main>
  );
}
