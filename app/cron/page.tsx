import type { Metadata } from "next";
import { CronParser } from "@/src/components/CronParser";

export const metadata: Metadata = {
  title: "Cron Parser — File Converter",
  description: "Explain a cron expression and see the next scheduled runs.",
};

export default function CronPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <CronParser />
    </main>
  );
}
