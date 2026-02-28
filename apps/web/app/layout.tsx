import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ReviewEverything | 인플루언서 캠페인 통합 허브",
  description: "국내 7개 리뷰 플랫폼 캠페인을 한 곳에서 검색하고 비교하세요. 나에게 딱 맞는 캠페인을 찾는 가장 스마트한 방법.",
  openGraph: {
    title: "ReviewEverything - 모든 인플루언서 캠페인의 시작",
    description: "흩어져 있는 리뷰 캠페인들을 한곳에서 모아보고 비교하세요.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewEverything",
    description: "인플루언서 캠페인 통합 검색 엔진",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-slate-50 min-h-screen text-slate-900 flex flex-col`}>
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="font-black text-xl tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ReviewEverything
            </Link>
            <div className="flex gap-6 text-sm font-medium">
              <Link href="/" className="hover:text-blue-600 transition">캠페인 찾기</Link>
              <Link href="/admin" className="hover:text-amber-600 transition">관리자 모드</Link>
            </div>
          </div>
        </nav>
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t py-8 text-center text-sm text-slate-500 mt-auto">
          © 2026 ReviewEverything. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
