import type { Metadata } from "next";
import { JwtDecoder } from "@/src/components/JwtDecoder";

export const metadata: Metadata = {
  title: "JWT Decoder — File Converter",
  description: "Inspect JSON Web Token headers, payloads, and expiry in your browser.",
};

export default function JwtPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <JwtDecoder />
    </main>
  );
}
