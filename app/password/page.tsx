import type { Metadata } from "next";
import { PasswordGenerator } from "@/src/components/PasswordGenerator";

export const metadata: Metadata = {
  title: "Password Generator — File Converter",
  description: "Generate cryptographically random passwords.",
};

export default function PasswordPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <PasswordGenerator />
    </main>
  );
}
