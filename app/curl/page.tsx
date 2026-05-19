import type { Metadata } from "next";
import { CurlToFetch } from "@/src/components/CurlToFetch";

export const metadata: Metadata = {
  title: "cURL → Fetch",
  description: "Convert cURL commands to JavaScript fetch() calls — supports headers, body, auth, and more.",
};

export default function CurlPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <CurlToFetch />
    </main>
  );
}
