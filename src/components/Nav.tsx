"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "File Converter" },
  { href: "/json", label: "JSON Tools" },
  { href: "/base64", label: "Base64" },
  { href: "/jwt", label: "JWT" },
  { href: "/regex", label: "Regex" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 px-4">
      <div className="mx-auto flex h-12 max-w-5xl items-center gap-6">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-sm font-medium transition-colors duration-150 ${
              pathname === href
                ? "text-amber-400"
                : "text-zinc-400 hover:text-zinc-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
