import type { Metadata } from "next";
import { ExifViewer } from "@/src/components/ExifViewer";

export const metadata: Metadata = {
  title: "EXIF Viewer",
  description: "View photo metadata and EXIF data from images.",
};

export default function ExifPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <ExifViewer />
    </main>
  );
}
