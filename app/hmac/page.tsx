import type { Metadata } from "next";
import { HmacGenerator } from "@/src/components/HmacGenerator";

export const metadata: Metadata = {
  title: "HMAC Generator",
  description: "Generate HMAC-SHA256/384/512 signatures from a message and secret key.",
};

export default function HmacPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <HmacGenerator />
    </main>
  );
}
