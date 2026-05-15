import type { Metadata } from "next";
import { HttpClient } from "@/src/components/HttpClient";

export const metadata: Metadata = {
  title: "HTTP Client",
  description: "Send HTTP requests and inspect responses in the browser.",
};

export default function HttpPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-start justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <HttpClient />
    </main>
  );
}
