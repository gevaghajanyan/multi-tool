import type { Metadata } from "next";
import { SlugGenerator } from "@/src/components/SlugGenerator";

export const metadata: Metadata = {
  title: "Slug Generator",
  description: "Convert any phrase into a URL-friendly slug with custom separator, case, and length options.",
};

export default function SlugPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <SlugGenerator />
    </main>
  );
}
