import type { Metadata } from "next";
import { MarkdownPreview } from "@/src/components/MarkdownPreview";

export const metadata: Metadata = {
  title: "Markdown Preview — File Converter",
  description: "Write Markdown and see the rendered output live.",
};

export default function MarkdownPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <MarkdownPreview />
    </main>
  );
}
