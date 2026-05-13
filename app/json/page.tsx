import type { Metadata } from "next";
import { JsonFormatter } from "@/src/components/JsonFormatter";

export const metadata: Metadata = {
  title: "JSON Tools — File Converter",
  description: "Format, parse, and diff JSON or JavaScript objects in your browser.",
};

export default function JsonPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      <JsonFormatter />
    </main>
  );
}
