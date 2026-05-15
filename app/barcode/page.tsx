import type { Metadata } from "next";
import { BarcodeGenerator } from "@/src/components/BarcodeGenerator";

export const metadata: Metadata = {
  title: "Barcode Generator",
  description: "Generate barcodes and QR codes in the browser.",
};

export default function BarcodePage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <BarcodeGenerator />
    </main>
  );
}
