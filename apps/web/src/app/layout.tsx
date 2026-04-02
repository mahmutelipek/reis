import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { isClerkConfigured } from "@/lib/clerk-config";
import "./globals.css";

/** Vercel / Windows / Linux: SF Pro yoksa bu devreye girer (globals --font-sans). */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Kod / monospace */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Promptly",
  description:
    "Kurumsal async video ve görünmez teleprompter — söyle, göster, paylaş.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  const inner = (
    <html
      lang="tr"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );

  if (!isClerkConfigured() || !pk) {
    return inner;
  }

  return <ClerkProvider publishableKey={pk}>{inner}</ClerkProvider>;
}
