import type { Metadata } from "next";
import { HtmlEntities } from "@/src/components/HtmlEntities";

export const metadata: Metadata = {
  title: "HTML Entities — File Converter",
  description: "Encode or decode HTML entities in text.",
};

export default function HtmlPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <HtmlEntities />
    </main>
  );
}
