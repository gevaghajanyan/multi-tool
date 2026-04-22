import type { ConverterType } from "@/src/types/converter";

export const FORMATS: Record<
  ConverterType,
  { input: string[]; output: string[] }
> = {
  video: {
    input: ["mp4", "webm", "mkv", "mov", "avi", "flv"],
    output: ["mp4", "webm", "mkv", "mov", "avi"],
  },
  audio: {
    input: ["mp3", "wav", "ogg", "flac", "aac", "m4a"],
    output: ["mp3", "wav", "ogg", "flac", "aac"],
  },
  image: {
    input: ["jpg", "png", "webp", "gif", "bmp", "tiff"],
    output: ["jpg", "png", "webp", "gif", "bmp"],
  },
};

export const IMAGE_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
};

export function extensionOf(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function normalizeExtension(ext: string): string {
  const lower = ext.toLowerCase();
  if (lower === "jpeg") return "jpg";
  if (lower === "tif") return "tiff";
  return lower;
}

export function acceptFor(type: ConverterType): string {
  return FORMATS[type].input.map((ext) => `.${ext}`).join(",");
}
