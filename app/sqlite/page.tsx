import type { Metadata } from "next";
import { SqlitePlayground } from "@/src/components/SqlitePlayground";

export const metadata: Metadata = {
  title: "SQLite Playground",
  description: "Run SQL queries in the browser with an in-memory SQLite database.",
};

export default function SqlitePage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <SqlitePlayground />
    </main>
  );
}
