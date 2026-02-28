import type { Metadata, Viewport } from "next";
import "./globals.css";
import Link from "next/link";
import { Suspense } from "react";
import NavStats from "@/components/NavStats";
import NavFavoritesBadge from "@/components/NavFavoritesBadge";
import PWAPrompt from "@/components/PWAPrompt";
import { CalendarDays } from "lucide-react";
import { Menu, Map as MapIcon, Package, UserCheck, LayoutList } from "lucide-react";

export const metadata: Metadata = {
  title: "체험단 모아 | 국내 7대 플랫폼 체험단 통합 탐색기",
  description:
    "레뷰, 리뷰노트, 디너의여왕, 리뷰플레이스, 서울오빠, 미스터블로그, 강남맛집 — 국내 7대 체험단 플랫폼 캠페인을 한눈에 비교하고 신청하세요.",
  keywords: "체험단, 리뷰단, 인플루언서, 레뷰, 리뷰노트, 디너의여왕, 블로그 체험단, 인스타 체험단",
  manifest: "/manifest.json",
  openGraph: {
    title: "체험단 모아 — 체험단의 모든 것을 한눈에",
    description: "국내 7대 체험단 플랫폼을 실시간으로 통합 수집합니다.",
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
    <html lang="ko">
      <body className="bg-[#f8fafc] min-h-screen text-slate-900 flex flex-col selection:bg-blue-500 selection:text-white">
        {/* ── Sticky Premium Nav 2.0 (Moaview Style) ── */}
        <header className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm">
          <div className="max-w-[1700px] mx-auto px-4 md:px-8 h-[64px] flex items-center justify-between gap-4">
            {/* Left: Logo & Core Tabs */}
            <div className="flex items-center gap-8">
              <Link href="/" className="shrink-0 flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl group-hover:bg-blue-600 transition-all duration-500">
                  <LayoutList className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-sm tracking-tighter text-slate-900 leading-none">체험단 모아</span>
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none mt-1">Beta 2.0</span>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-1">
                  <Link href="/me?userId=1" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">
                    <CalendarDays className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-black text-slate-500 group-hover:text-slate-900">내 매니저</span>
                  </Link>
                  <Link href="/?campaign_type=VST" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">
                  <span className="text-xs font-black text-slate-500 group-hover:text-slate-900">방문형</span>
                </Link>
                <Link href="/?campaign_type=VST&view=map" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">
                  <MapIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs font-black text-slate-500 group-hover:text-slate-900">방문(지도)</span>
                </Link>
                <Link href="/?campaign_type=SHP" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">
                  <Package className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-black text-slate-500 group-hover:text-slate-900">배송형</span>
                </Link>
                <Link href="/?campaign_type=PRS" className="group flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-xs font-black text-slate-500 group-hover:text-slate-900">기자단</span>
                </Link>
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <div className="flex items-center gap-1 md:gap-3 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                <NavFavoritesBadge />
                <Suspense fallback={<div className="w-20 h-8 skeleton rounded-xl" />}>
                  <NavStats />
                </Suspense>
              </div>

              <div className="w-px h-6 bg-slate-200 hidden sm:block" />

              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="flex items-center justify-center w-10 h-10 md:w-auto md:px-5 md:py-2 rounded-2xl bg-slate-900 text-white hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                >
                  <span className="hidden md:inline text-[11px] font-black uppercase tracking-widest">Console</span>
                  <Menu className="w-5 h-5 md:hidden" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 relative">
          {children}
        </main>

        <PWAPrompt />
      </body>
    </html>
  );
}
