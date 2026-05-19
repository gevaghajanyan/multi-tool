import type { Metadata } from "next";
import { RsaKeyPair } from "@/src/components/RsaKeyPair";

export const metadata: Metadata = {
  title: "RSA Key Pair Generator",
  description: "Generate RSA public and private key pairs in PEM format — 2048 or 4096 bit.",
};

export default function RsaPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <RsaKeyPair />
    </main>
  );
}
