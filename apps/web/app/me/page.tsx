import Link from "next/link";
import { Bell, BarChart3, CalendarDays, Clock3, MapPin } from "lucide-react";

import AICuration from "@/components/AICuration";
import ManagerDashboard from "@/components/ManagerDashboard";

type TabKey = "dashboard" | "stats";
type MeSearchParams = {
  userId?: string;
  tab?: string;
};

const MY_DASHBOARD_STATS = [
  { label: "활성 알림", value: "72", change: "+2", up: true },
  { label: "누적 모집수", value: "4.25M", change: "+38K", up: true },
  { label: "최근 합격률", value: "2.3:1", change: "-0.4", up: false },
];

const QUICK_ACTIONS = [
  { href: "/me/notifications", label: "알림 이력 확인", icon: Bell },
  { href: "/me/notifications?userId=1", label: "알림 전송 상태", icon: BarChart3 },
  { href: "/me/calendar", label: "일정 캘린더 열기", icon: CalendarDays },
  { href: "/admin", label: "운영 콘솔 보기", icon: MapPin },
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
  const userId = Number.parseInt(params?.userId || "1", 10);
  const activeTab = params?.tab === "stats" ? "stats" : "dashboard";

  return (
    <main className="py-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-6 space-y-6">
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
              href={activeTab === "stats" ? "/me" : "/me?tab=stats"}
              className="shrink-0 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-black hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {activeTab === "stats" ? "요약 보기" : "성과 통계"}
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-xs md:text-sm text-slate-500 dark:text-slate-400">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">사용자 ID: {userId}</div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">현재 모드: {activeTab === "stats" ? "성과 분석" : "운영용 요약"}</div>
          </div>
        </section>

        {activeTab === "stats" ? (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {MY_DASHBOARD_STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm"
              >
                <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</p>
                <span
                  className={`text-[11px] font-black px-2 py-1 rounded-lg ${
                    stat.up
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            ))}
          </section>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        key={action.href}
                        href={action.href}
                        className="text-sm px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors"
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
                href="/me/settings"
                className="group inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 transition-colors"
              >
                <span className="font-black text-slate-700 dark:text-slate-200">프로필·알림 설정</span>
                <span className="text-xs text-slate-500">바로가기</span>
              </Link>
              <Link
                href="/me/console"
                className="group inline-flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-500 transition-colors"
              >
                <span className="font-black text-slate-700 dark:text-slate-200">프로젝트 콘솔</span>
                <span className="text-xs text-slate-500">바로가기</span>
              </Link>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
