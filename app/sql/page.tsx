import type { Metadata } from "next";
import { SqlFormatter } from "@/src/components/SqlFormatter";

export const metadata: Metadata = {
  title: "SQL Formatter",
  description: "Format and minify SQL queries with automatic keyword uppercasing and clause indentation.",
};

export default function SqlPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <SqlFormatter />
    </main>
  );
}
