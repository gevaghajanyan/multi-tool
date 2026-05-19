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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const DESCRIPTION = "Free browser-based developer utilities — JSON, Base64, JWT, regex, UUID, DNS, HTTP client and more. No installs, no uploads.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Dev Tools",
    template: "%s — Dev Tools",
  },
  description: DESCRIPTION,
  keywords: [
    "developer tools", "dev tools", "json formatter", "base64 encoder", "jwt decoder",
    "regex tester", "uuid generator", "timestamp converter", "dns lookup", "http client",
    "browser tools", "online tools", "free developer utilities",
  ],
  openGraph: {
    type: "website",
    siteName: "Dev Tools",
    title: {
      default: "Dev Tools",
      template: "%s — Dev Tools",
    },
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: {
      default: "Dev Tools",
      template: "%s — Dev Tools",
    },
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100" suppressHydrationWarning>
        {/* Runs before first paint — removes `dark` if user saved light preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=JSON.parse(localStorage.getItem('devtools-settings-v2')||'{}');if(p.theme==='light')document.documentElement.classList.remove('dark');}catch(e){}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(!window.crossOriginIsolated&&'serviceWorker'in navigator){navigator.serviceWorker.register('${process.env.NEXT_PUBLIC_BASE_PATH??''}/coi-serviceworker.js').then(function(r){if(!r.active)window.location.reload();})}})();`,
          }}
        />
        <SettingsProvider>
          <AccentStyler />
          <Nav />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}
