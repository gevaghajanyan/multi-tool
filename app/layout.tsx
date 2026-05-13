import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/src/components/Nav";
import { SettingsProvider } from "@/src/context/SettingsContext";
import { AccentStyler } from "@/src/components/AccentStyler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dev Tools",
  description: "A collection of browser-based developer utilities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100" suppressHydrationWarning>
        <SettingsProvider>
          <AccentStyler />
          <Nav />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
