import type { Metadata } from "next";
import { TimestampConverter } from "@/src/components/TimestampConverter";

export const metadata: Metadata = {
  title: "Timestamp Converter",
  description: "Convert Unix timestamps and date strings across timezones.",
};

export default function TimestampPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <TimestampConverter />
    </main>
  );
}
