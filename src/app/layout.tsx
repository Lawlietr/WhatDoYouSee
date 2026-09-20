import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProviders } from "@/components/ThemeProviders";
import { AppProviders } from "@/components/AppProviders";
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
  title: "What Do You See?",
  description:
    "上傳一張照片，看看旁觀者能從中推斷出關於你的什麼。所有分析都在本地執行。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-TW"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProviders>
          <AppProviders>{children}</AppProviders>
        </ThemeProviders>
      </body>
    </html>
  );
}
