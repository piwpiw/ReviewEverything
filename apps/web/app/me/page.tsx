import Link from "next/link";
import type { Metadata } from "next";
import { Bell, BarChart3, CalendarDays, Clock3, Monitor } from "lucide-react";

import AICuration from "@/components/AICuration";
import ManagerDashboard from "@/components/ManagerDashboard";

export const metadata: Metadata = {
  title: "내 대시보드 | 리뷰에브리띵",
  description: "활동 요약, 일정, 알림을 한 콘솔에서 관리하세요.",
  alternates: { canonical: "/me" },
};

type MeSearchParams = {
  userId?: string;
  tab?: string;
};

const QUICK_ACTIONS = [
  { href: "/me/notifications", label: "알림 이력 확인", icon: Bell },
  { href: "/system", label: "알림 전송 상태", icon: BarChart3 },
  { href: "/me/calendar", label: "일정 캘린더 열기", icon: CalendarDays },
  { href: "/admin", label: "운영 콘솔 보기", icon: Monitor },
];

const GUIDE_CARDS = [
  {
    title: "점검 포인트",
    icon: Clock3,
    items: [
      "마감 3일 이내 캠페인은 우선 순위를 높여 점검하세요.",
      "지원자/모집 수가 급격히 변동하면 데이터 정합성을 먼저 확인하세요.",
      "지역·유형·카테고리 기반으로 정렬해 이탈 후보를 선별하세요.",
    ],
  },
  {
    title: "오늘 할 일",
    icon: CalendarDays,
    items: [
      "캠페인 상세에서 지원/일정 등록을 한 번에 확인하세요.",
      "알림 채널 동작 상태를 점검해 실패율을 낮추세요.",
      "D-1, D-3 항목을 캘린더 우선 순위로 처리하세요.",
    ],
  },
];

export default async function MePage({ searchParams }: { searchParams: Promise<MeSearchParams> }) {
  const params = await searchParams;
  const requestedUserId = params?.userId?.trim?.() || "";
  const parsedUserId = Number.parseInt(requestedUserId || "1", 10);
  const isValidUserId = Boolean(requestedUserId) && Number.isFinite(parsedUserId) && parsedUserId > 0;
  const userId = Number.isFinite(parsedUserId) && parsedUserId > 0 ? parsedUserId : 1;
  const activeTab = params?.tab === "stats" ? "stats" : "dashboard";

  const dashboardHref = `/me?userId=${userId}`;
  const statsHref = `/me?userId=${userId}&tab=stats`;

  const userAwareAction = (href: string) => {
    if (href === "/admin") {
      return `${href}?from=me`;
    }
    if (href === "/me/console") {
      return `${href}?userId=${userId}`;
    }
    return `${href}?userId=${userId}`;
  };

  return (
    <main className="py-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-5 space-y-4">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">사용자 대시보드</p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">내 활동과 일정, 알림을 한 곳에서 관리</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                활동 요약, 알림, 일정, 프로젝트 화면까지 하나의 워크플로우로 이동할 수 있습니다.
              </p>
            </div>
            <Link
              href={activeTab === "stats" ? dashboardHref : statsHref}
              aria-label={activeTab === "stats" ? "요약 보기로 전환" : "성과 통계 탭으로 전환"}
              className="shrink-0 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-black hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {activeTab === "stats" ? "요약 보기" : "성과 통계"}
            </Link>
          </div>
          {isValidUserId ? null : (
            <div className="rounded-xl border border-amber-300/40 bg-amber-100/40 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-xs px-3 py-2">
              사용자 ID가 누락되었거나 유효하지 않아 기본 사용자(1)로 안전하게 표시했습니다.
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3 text-xs md:text-sm text-slate-500 dark:text-slate-400">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">현재 탭 상태: {activeTab === "stats" ? "성과 분석" : "운영용 요약"}</div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">연결 사용자 ID: {userId}</div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-2">
            <h2 className="text-sm font-black text-slate-900 dark:text-white">워크스페이스 status 패널</h2>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              status: ready · 조회 실패 시 fallback 대시보드 카드와 복구 동선을 제공합니다.
            </p>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-2 w-2/3 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              아직 표시할 맞춤 추천이 없습니다. 기본 화면을 먼저 확인하고 다시 시도할 수 있습니다.
            </p>
            <a
              href={dashboardHref}
              aria-label="내 워크스페이스 다시 시도"
              className="inline-flex items-center rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-black text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              대시보드 다시 시도
            </a>
          </div>
        </section>

        {activeTab === "stats" ? (
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
            <p className="text-sm font-black text-slate-900 dark:text-white">성과 통계 데이터가 아직 연결되지 않았습니다.</p>
            <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              임의 수치는 제거했습니다. 실제 집계가 준비되면 이 영역에 실데이터만 표시합니다.
            </p>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                <p className="text-xs font-black text-slate-400 dark:text-slate-500 flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5" />
                  빠른 바로가기
                </p>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mt-3">핵심 액션</h2>
                <div className="mt-4 grid gap-2">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        href={userAwareAction(action.href)}
                        aria-label={`${action.label} 페이지로 이동`}
                        className="text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        <Icon className="inline-block w-3.5 h-3.5 mr-2" />
                        {action.label}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {GUIDE_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                    <p className="text-xs font-black text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" /> {card.title}
                    </p>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mt-3">{card.title} 가이드</h2>
                    <ul className="mt-4 text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside">
                      {card.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>

            <section>
              <ManagerDashboard userId={Number.isFinite(userId) ? userId : 1} />
            </section>

            <section>
              <AICuration />
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Link
                href={`/me/settings?userId=${userId}`}
                aria-label="프로필 및 알림 설정 페이지로 이동"
                className="group inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span className="font-black text-slate-700 dark:text-slate-200">프로필·알림 설정</span>
                <span className="text-xs text-slate-500">바로가기</span>
              </Link>
              <Link
                href={`/me/console?userId=${userId}`}
                aria-label="프로젝트 콘솔로 이동"
                className="group inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span className="font-black text-slate-700 dark:text-slate-200">프로젝트 콘솔</span>
                <span className="text-xs text-slate-500">바로가기</span>
              </Link>
            </section>

            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">복구 동선</p>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                일정/알림 동선 조회가 실패해도 같은 사용자 컨텍스트로 바로 이동할 수 있도록 단절 없는 경로를 제공합니다.
              </p>
              <div className="grid sm:grid-cols-3 gap-2 text-xs">
                <Link href={`/me/calendar?userId=${userId}`} className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-center font-black text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  일정 미조회 복구
                </Link>
                <Link href={`/me/notifications?userId=${userId}`} className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-center font-black text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  알림 미조회 복구
                </Link>
                <Link href={statsHref} className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-center font-black text-slate-700 dark:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  성과 탭 재요청
                </Link>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
