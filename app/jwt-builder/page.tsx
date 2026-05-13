import type { Metadata } from "next";
import { JwtBuilder } from "@/src/components/JwtBuilder";

export const metadata: Metadata = {
  title: "JWT Builder — File Converter",
  description: "Sign a JSON payload and build a JWT token.",
};

export default function JwtBuilderPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      <JwtBuilder />
    </main>
  );
}
