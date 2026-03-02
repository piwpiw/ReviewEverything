import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Suspense } from "react";
import Header from "@/components/Header";
import PWAPrompt from "@/components/PWAPrompt";
import MobileNav from "@/components/MobileNav";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "리뷰에브리띵 | 리뷰 운영은 한 번의 검색으로 정리",
  description: "검색, 필터, 지도, 일정까지 한 화면에서 관리하는 한국형 리뷰 캠페인 허브입니다.",
  keywords: "리뷰 캠페인 플랫폼, 리뷰어, 인플루언서, 플랫폼, 지도, 쿠폰, 방문형, 쇼핑형",
  manifest: "/manifest.json",
  openGraph: {
    title: "리뷰에브리띵 | 리뷰 운영 허브",
    description: "빠른 검색과 지도 기반 필터링으로 캠페인을 운영하고 관리하세요.",
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
          <Suspense
            fallback={
              <div className="h-[72px] bg-white/70 dark:bg-slate-900/70 border-b border-slate-100/80 dark:border-slate-800/80" />
            }
          >
            <Header />
          </Suspense>
          <main className="flex-1 relative">
            <div className="max-w-[1700px] mx-auto min-h-[calc(100vh-72px)]">{children}</div>
          </main>
          <Suspense fallback={null}>
            <MobileNav />
          </Suspense>
          <PWAPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
