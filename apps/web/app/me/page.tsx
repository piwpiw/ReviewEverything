import ManagerDashboard from "@/components/ManagerDashboard";
import Link from "next/link";
import { CalendarDays, LayoutDashboard, TrendingUp, Settings } from "lucide-react";
import AICuration from "@/components/AICuration";

type TabKey = "dashboard" | "calendar" | "stats";
type MeSearchParams = {
  userId?: string;
  tab?: string;
};

const tabs: Array<{ id: TabKey; label: string; href: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "대시보드", href: "/me", icon: LayoutDashboard },
  { id: "calendar", label: "캘린더", href: "/me/calendar", icon: CalendarDays },
  { id: "stats", label: "통계", href: "/me?tab=stats", icon: TrendingUp },
];

export default async function MePage({ searchParams }: { searchParams: Promise<MeSearchParams> }) {
  const params = await searchParams;
  const userId = Number.parseInt(params?.userId || "1", 10);
  const activeTab = (params?.tab === "calendar" || params?.tab === "stats" || params?.tab === "dashboard") ? (params.tab as TabKey) : "dashboard";

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-0">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">리뷰 허브</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">
              캠페인 진행률, 일정 현황, 실무용 도구를 한 화면에서 확인하세요.
            </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/me/settings"
                className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 transition-all active:scale-95 border border-slate-200 dark:border-slate-700"
                title="설정"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <Link
                href="/me/calendar"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <CalendarDays className="w-4 h-4" />
                캘린더 열기
              </Link>
            </div>
          </div>

          <div className="flex gap-0">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {activeTab === "stats" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "총 캠페인 수", value: "72", change: "+2", up: true },
              { label: "예상 매출", value: "4.25M", change: "+38K", up: true },
              { label: "리뷰 전환율", value: "2.3:1", change: "-0.4", up: false },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
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
          </div>
        ) : (
          <div className="space-y-12">
            <ManagerDashboard userId={Number.isFinite(userId) ? userId : 1} />
            <AICuration />
          </div>
        )}
      </div>
    </main>
  );
}
