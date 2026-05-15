import type { Metadata } from "next";
import { MarkdownToPdf } from "@/src/components/MarkdownToPdf";

export const metadata: Metadata = {
  title: "Markdown → PDF",
  description: "Convert Markdown to a downloadable PDF.",
};

export default function MdPdfPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <MarkdownToPdf />
    </main>
  );
}
