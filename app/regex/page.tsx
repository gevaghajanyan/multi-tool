import type { Metadata } from "next";
import { RegexTester } from "@/src/components/RegexTester";

export const metadata: Metadata = {
  title: "Regex Tester — File Converter",
  description: "Test regular expressions with live match highlighting.",
};

export default function RegexPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <RegexTester />
    </main>
  );
}
