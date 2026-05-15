import type { Metadata } from "next";
import { IpInfo } from "@/src/components/IpInfo";

export const metadata: Metadata = {
  title: "IP Info — Dev Tools",
  description: "Look up geolocation and network details for any IP address.",
};

export default function IpPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <IpInfo />
    </main>
  );
}
