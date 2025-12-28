import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import MenuBar from "@/components/MenuBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tensor Terminal - Real-time Stock Insights",
  description: "Track global markets, news, and your watchlist in real-time.",
};

import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 items-center justify-items-center min-h-screen`}
          suppressHydrationWarning
        >
          <Navbar />
          <main className="pt-16 pb-20 md:pb-0 w-full">
              {children}
          </main>
          <MenuBar />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
