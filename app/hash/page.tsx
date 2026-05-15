import type { Metadata } from "next";
import { HashGenerator } from "@/src/components/HashGenerator";

export const metadata: Metadata = {
  title: "Hash Generator",
  description: "Generate SHA hashes from text or files.",
};

export default function HashPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <HashGenerator />
    </main>
  );
}
