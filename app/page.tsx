import { Converter } from "@/src/components/Converter";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-zinc-950 px-4 py-16 text-zinc-100">
      <Converter />
    </main>
  );
}
