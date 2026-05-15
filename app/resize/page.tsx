import type { Metadata } from "next";
import { ImageResize } from "@/src/components/ImageResize";

export const metadata: Metadata = {
  title: "Image Resize",
  description: "Resize images locally in your browser — nothing is uploaded.",
};

export default function ResizePage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 text-zinc-100 sm:py-16">
      <ImageResize />
    </main>
  );
}
