import type { Metadata } from "next";
import { UuidGenerator } from "@/src/components/UuidGenerator";

export const metadata: Metadata = {
  title: "UUID Generator — File Converter",
  description: "Generate version 4 UUIDs.",
};

export default function UuidPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      <UuidGenerator />
    </main>
  );
}
