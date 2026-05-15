import type { Metadata } from "next";
import { TextDiff } from "@/src/components/TextDiff";

export const metadata: Metadata = {
  title: "Text Diff",
  description: "Compare two blocks of text line by line.",
};

export default function DiffPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <TextDiff />
    </main>
  );
}
