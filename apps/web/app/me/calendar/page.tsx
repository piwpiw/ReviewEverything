import Link from "next/link";
import type { Metadata } from "next";
import { CalendarClock, ChevronRight, Clock3, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "일정 캘린더 | 리뷰에브리띵",
  description: "캘린더 연동 전 임시 화면입니다. 아래 동선으로 동일한 사용자 컨텍스트를 유지할 수 있습니다.",
  alternates: { canonical: "/me/calendar" },
  robots: { index: false },
};

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="page-shell page-stack gap-4 max-w-5xl">
        <section className="section-card p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <p className="section-title inline-flex items-center gap-2">
                <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
                일정 캘린더
              </p>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">캘린더 화면 고도화 준비 중</h1>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-300 mt-2">
                일정 조회 API와 연동 전 임시 화면입니다. 아래 동선으로 동일한 사용자 컨텍스트를 유지할 수 있습니다.
              </p>
            </div>
            <span className="chip-muted">임시 복구 모드</span>
          </div>
          <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">캘린더 연동 status</h2>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              status: loading-preview · 연동 실패 시 fallback 일정 동선으로 전환됩니다.
            </p>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-2 w-1/3 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              아직 연결된 일정이 없습니다. 아래 빠른 이동에서 같은 사용자 컨텍스트로 복구할 수 있습니다.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="section-card p-4">
            <p className="section-title">1단계</p>
            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">오늘 마감 일정 확인</p>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">마이페이지의 최근 알림에서 D-Day 항목을 먼저 점검하세요.</p>
          </div>
          <div className="section-card p-4">
            <p className="section-title">2단계</p>
            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">알림 상태 재확인</p>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">실패 알림은 알림 페이지에서 즉시 재시도할 수 있습니다.</p>
          </div>
          <div className="section-card p-4">
            <p className="section-title">3단계</p>
            <p className="mt-2 text-sm font-black text-slate-900 dark:text-white">상세 일정 등록</p>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">캠페인 상세의 일정 등록 버튼으로 바로 연계하세요.</p>
          </div>
        </section>

        <section className="section-card p-5 md:p-6">
          <h2 className="text-sm font-black text-slate-900 dark:text-white mb-3 inline-flex items-center gap-2">
            <Clock3 className="w-4 h-4 text-blue-500" />
            빠른 이동
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm">
            <Link
              href="/me"
              aria-label="사용자 대시보드로 이동"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 font-black text-slate-700 dark:text-slate-200 inline-flex items-center justify-between transition-colors hover:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              사용자 대시보드
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/me/notifications"
              aria-label="알림 이력 페이지로 이동"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 font-black text-slate-700 dark:text-slate-200 inline-flex items-center justify-between transition-colors hover:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              알림 이력
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link
              href="/?sort=deadline_asc"
              aria-label="마감 임박 캠페인 목록으로 이동"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 font-black text-slate-700 dark:text-slate-200 inline-flex items-center justify-between transition-colors hover:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              마감 임박 목록
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-blue-300/40 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-xs text-blue-900 dark:text-blue-200 inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            캘린더 연동 전까지 위 동선이 기본 복구 경로로 유지됩니다.
          </div>
          <a
            href="/me/calendar?retry=1"
            aria-label="캘린더 상태 다시 시도"
            className="mt-3 inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            캘린더 다시 시도
          </a>
        </section>
      </div>
    </main>
  );
}
