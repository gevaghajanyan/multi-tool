import type { Metadata } from "next";
import { VideoThumb } from "@/src/components/VideoThumb";

export const metadata: Metadata = {
  title: "Video Thumbnail — Dev Tools",
  description: "Extract frames from videos as PNG images.",
};

export default function VideoThumbPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <VideoThumb />
    </main>
  );
}
