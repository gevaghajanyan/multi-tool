import type { Metadata } from "next";
import { DnsLookup } from "@/src/components/DnsLookup";

export const metadata: Metadata = {
  title: "DNS Lookup — Dev Tools",
  description: "Query DNS records for any domain via Cloudflare DNS-over-HTTPS.",
};

export default function DnsPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <DnsLookup />
    </main>
  );
}
