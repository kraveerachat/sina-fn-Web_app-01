import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Sina_FN — Personal Finance",
  description:
    "HUD-style personal finance tracker. Record income, expenses, budgets and get AI insights.",
  keywords: ["finance", "budget", "expense tracker", "Thai", "personal finance"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#1A1D21] text-[#E8EAF0]">
        {children}
      </body>
    </html>
  );
}
