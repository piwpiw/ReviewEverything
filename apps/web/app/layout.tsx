import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Suspense } from "react";
import NavStats from "@/components/NavStats";

export const metadata: Metadata = {
  title: "체험단 모아 | 국내 7대 플랫폼 체험단 통합 탐색기",
  description:
    "레뷰, 리뷰노트, 디너의여왕, 리뷰플레이스, 서울오빠, 미스터블로그, 강남맛집 — 국내 7대 체험단 플랫폼 캠페인을 한눈에 비교하고 신청하세요.",
  keywords: "체험단, 리뷰단, 인플루언서, 레뷰, 리뷰노트, 디너의여왕, 블로그 체험단, 인스타 체험단",
  openGraph: {
    title: "체험단 모아 — 체험단의 모든 것을 한눈에",
    description: "국내 7대 체험단 플랫폼을 실시간으로 통합 수집합니다.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="bg-[#f8fafc] min-h-screen text-slate-900 flex flex-col">
        {/* ── Sticky Premium Nav ── */}
        <header className="sticky top-0 z-[100] glass-card border-b border-white/50 shadow-sm shadow-slate-900/5">
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 h-[60px] flex items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="font-black text-lg tracking-tight text-gradient-blue hidden sm:block">
                체험단 모아
              </span>
            </Link>

            {/* Center Nav */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/50">
              <Link href="/?view=list" className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all">
                📋 목록형
              </Link>
              <Link href="/?view=map" className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all">
                🗺️ 지도형
              </Link>
              <Link href="/?campaign_type=VST" className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all">
                🍽 방문형
              </Link>
              <Link href="/?campaign_type=SHP" className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all">
                📦 배송형
              </Link>
            </nav>

            {/* Right: Live Stats + Admin */}
            <div className="flex items-center gap-3 shrink-0">
              <Suspense fallback={<div className="w-28 h-7 skeleton rounded-xl" />}>
                <NavStats />
              </Suspense>
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-black hover:bg-blue-600 transition-all shadow-md"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                관리자
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
