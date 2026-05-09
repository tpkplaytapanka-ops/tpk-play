import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TPK PLAY — Streaming en Vivo",
  description: "Plataforma de streaming y entretenimiento TPK PLAY. TV en vivo, radio, música y más desde Colombia.",
  keywords: ["TPK PLAY", "streaming", "Colombia", "TV en vivo", "radio", "música"],
  authors: [{ name: "Tapán Kat PK" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "TPK PLAY — Streaming en Vivo",
    description: "Plataforma de streaming y entretenimiento desde Colombia",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-white min-h-screen flex flex-col`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
