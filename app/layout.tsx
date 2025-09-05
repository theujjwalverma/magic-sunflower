import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import FeedSubscriptions from "@/components/feed/feed-subscriptions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Couple Connect",
  description:
    "A private social network for couples to share messages, photos, and memories",
  generator: "Next.js",
  keywords: "couples, social network, private messaging, photo sharing",
  authors: [{ name: "Couple Connect Team" }],
  creator: "Couple Connect",
  publisher: "Couple Connect",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Couple Connect",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://couple-connect.app",
    title: "Couple Connect",
    description:
      "A private social network for couples to share messages, photos, and memories",
    siteName: "Couple Connect",
  },
  twitter: {
    card: "summary_large_image",
    title: "Couple Connect",
    description:
      "A private social network for couples to share messages, photos, and memories",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#000000",
};

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <Providers>
          {children}
          <FeedSubscriptions />
        </Providers>
      </body>
    </html>
  );
}
