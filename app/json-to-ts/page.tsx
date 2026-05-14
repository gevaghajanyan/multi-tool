import type { Metadata } from "next";
import { JsonToTs } from "@/src/components/JsonToTs";

export const metadata: Metadata = {
  title: "JSON → TypeScript — Dev Tools",
  description: "Generate TypeScript interfaces from JSON data, entirely in your browser.",
};

export default function JsonToTsPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 text-zinc-100 sm:py-16">
      <JsonToTs />
    </main>
  );
}
