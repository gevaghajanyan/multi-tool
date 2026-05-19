import type { Metadata } from "next";
import { SubnetCalculator } from "@/src/components/SubnetCalculator";

export const metadata: Metadata = {
  title: "Subnet Calculator",
  description: "Calculate network address, broadcast, subnet mask, host range and more from a CIDR block.",
};

export default function SubnetPage() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-8 sm:py-16 text-zinc-100">
      <SubnetCalculator />
    </main>
  );
}
