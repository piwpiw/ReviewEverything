import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { Suspense } from "react";
import Header from "@/components/Header";
import PWAPrompt from "@/components/PWAPrompt";
import ThemeToggle from "@/components/ThemeToggle";
import MobileNav from "@/components/MobileNav";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "리뷰 캠페인 허브 | 한국인을 위한 리뷰 캠페인 플랫폼",
  description: "검색, 필터, 지도, 일정까지 한 곳에서 관리하는 한국형 캠페인 허브입니다.",
  keywords: "캠페인, 리뷰, 홍보, 블로그, 인스타그램, 유튜브, 쇼츠, 로컬캠페인",
  manifest: "/manifest.json",
  openGraph: {
    title: "리뷰 캠페인 허브 | 실무형 검색 대시보드",
    description: "국내 캠페인 운영을 더 빠르게 실행할 수 있는 대시보드",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-background min-h-screen text-foreground flex flex-col selection:bg-blue-500 selection:text-white transition-colors duration-300">
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header />
          <main className="flex-1 relative">
            <div className="max-w-[1700px] mx-auto min-h-[calc(100vh-72px)]">
              {children}
            </div>
          </main>
          <MobileNav />
          <PWAPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
