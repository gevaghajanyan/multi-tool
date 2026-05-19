import type { Metadata } from "next";
import { XmlFormatter } from "@/src/components/XmlFormatter";

export const metadata: Metadata = {
  title: "XML Formatter",
  description: "Format, minify, and validate XML documents in the browser.",
};

export default function XmlPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <XmlFormatter />
    </main>
  );
}
