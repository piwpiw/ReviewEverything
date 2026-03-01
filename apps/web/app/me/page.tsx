import ManagerDashboard from "@/components/ManagerDashboard";
import Link from "next/link";
import { CalendarDays, LayoutDashboard, TrendingUp } from "lucide-react";
import AICuration from "@/components/AICuration";

export default async function MePage({ searchParams }: { searchParams: Promise<{ userId?: string; tab?: string }> }) {
    const params = await searchParams;
    const userId = Number(params?.userId || 1);
    const activeTab = params?.tab || "dashboard";

    const tabs = [
        { id: "dashboard", label: "대시보드", icon: LayoutDashboard, href: "/me" },
        { id: "calendar", label: "캘린더(일정 관리)", icon: CalendarDays, href: "/me/calendar" },
        { id: "stats", label: "분석 리포트", icon: TrendingUp, href: "/me?tab=stats" },
    ];

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
            {/* Page Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-0">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">마이 매니저</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">체험단 일정, 정산, 알림을 중앙 컨트롤 패널에서 확인합니다.</p>
                        </div>
                        <Link
                            href="/me/calendar"
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            <CalendarDays className="w-4 h-4" />
                            캘린더 열기
                        </Link>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-0">
                        {tabs.map(tab => (
                            <Link
                                key={tab.id}
                                href={tab.href}
                                className={`flex items-center gap-2 px-5 py-3 text-xs font-black border-b-2 transition-all ${activeTab === tab.id
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

            {/* Content */}
            <div className="max-w-[1200px] mx-auto px-6 py-8">
                {activeTab === "stats" ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: "이번 주 신규 플랫폼", value: "7개", change: "+2", up: true },
                            { label: "총 누적 협찬 가치", value: "425만 원", change: "+38만", up: true },
                            { label: "평균 경쟁률 유지", value: "2.3:1", change: "-0.4", up: false },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                                <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</p>
                                <span className={`text-[11px] font-black px-2 py-1 rounded-lg ${stat.up ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"}`}>
                                    {stat.change} 변경됨
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-12">
                        <ManagerDashboard userId={userId || 1} />
                        <AICuration />
                    </div>
                )}
            </div>
        </main>
    );
}
