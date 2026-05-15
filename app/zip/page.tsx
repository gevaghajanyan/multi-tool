import type { Metadata } from "next";
import { ZipInspector } from "@/src/components/ZipInspector";

export const metadata: Metadata = {
  title: "ZIP Inspector",
  description: "Inspect and extract files from ZIP archives locally.",
};

export default function ZipPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <ZipInspector />
    </main>
  );
}
