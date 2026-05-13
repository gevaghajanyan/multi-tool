import type { Metadata } from "next";
import { LoremIpsum } from "@/src/components/LoremIpsum";

export const metadata: Metadata = {
  title: "Lorem Ipsum — File Converter",
  description: "Generate placeholder text in seconds.",
};

export default function LoremPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      <LoremIpsum />
    </main>
  );
}
