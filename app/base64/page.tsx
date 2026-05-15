import type { Metadata } from "next";
import { Base64Tool } from "@/src/components/Base64Tool";

export const metadata: Metadata = {
  title: "Base64",
  description: "Encode and decode Base64 text and files in your browser.",
};

export default function Base64Page() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <Base64Tool />
    </main>
  );
}
