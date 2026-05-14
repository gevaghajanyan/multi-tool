import type { Metadata } from "next";
import { UrlParser } from "@/src/components/UrlParser";

export const metadata: Metadata = {
  title: "URL Parser — File Converter",
  description: "Break a URL into its parts and edit query parameters.",
};

export default function UrlPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <UrlParser />
    </main>
  );
}
