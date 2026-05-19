import type { Metadata } from "next";
import { AesTool } from "@/src/components/AesTool";

export const metadata: Metadata = {
  title: "AES Encrypt / Decrypt",
  description: "Encrypt and decrypt text using AES-GCM 256-bit encryption with PBKDF2 key derivation.",
};

export default function AesPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <AesTool />
    </main>
  );
}
