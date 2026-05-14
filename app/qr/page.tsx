import type { Metadata } from "next";
import { QrGenerator } from "@/src/components/QrGenerator";

export const metadata: Metadata = {
  title: "QR Code Generator — Dev Tools",
  description: "Generate QR codes for URLs, text, and more — entirely in your browser.",
};

export default function QrPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 text-zinc-100 sm:py-16">
      <QrGenerator />
    </main>
  );
}
