"use client";

import { useEffect, useState } from "react";
import ProUpgradeSection from "./ProUpgradeSection";
import { TrendingUp, CalendarDays, Bell } from "lucide-react";
import Link from "next/link";

interface ScheduleItem {
    id: number;
    custom_title?: string | null;
    visit_date?: string | null;
    deadline_date?: string | null;
    campaign?: { title: string } | null;
}

interface MonthlyStat {
    month: number;
    sponsorship: number;
    ad_fee: number;
    total: number;
    count: number;
}

interface RevenueSummary {
    totalSponsorshipValue: number;
    totalAdFee: number;
    totalCampaigns: number;
}

interface RevenueMonthly {
    summary?: RevenueSummary;
    month?: string;
    monthly?: MonthlyStat[];
    total_revenue?: number;
}

interface NotificationItem {
    id: number;
    message?: string | null;
    status: string;
}

type DashboardPayload = {
    schedules: ScheduleItem[];
    revenue: RevenueMonthly | null;
    notifications: NotificationItem[];
};

export default function ManagerDashboard({ userId }: { userId: number }) {
    const [data, setData] = useState<DashboardPayload>({
        schedules: [],
        revenue: null,
        notifications: [],
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const headers = { "x-user-id": String(userId) };
        const fetchAll = async () => {
            const boardRes = await fetch("/api/me/board", { headers });
            const board = boardRes.ok ? await boardRes.json() : null;
            setData({
                schedules: board?.schedules || [],
                revenue: board?.summary ? { summary: board.summary, month: board.month, monthly: board.monthly } : null,
                notifications: board?.notifications || [],
            });
            setLoading(false);
        };
        fetchAll().catch(() => setLoading(false));
    }, [userId]);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="px-2 py-0.5 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-[9px] font-black tracking-widest uppercase shadow-lg shadow-blue-500/20">Alpha V2.5</span>
                        <Link href="/me/console" className="flex items-center gap-2 group">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full group-hover:animate-ping" />
                            <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-500 transition-colors uppercase tracking-widest leading-none">Connect AI Hub &rarr;</span>
                        </Link>
                    </div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
                        My Manager Hub <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-xl">Intelligence Dashboard</span>
                    </h1>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <div className="bg-white dark:bg-slate-900 p-3 px-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sys Ingest</p>
                            <p className="text-xs font-black text-slate-900 dark:text-white">Active (v2.0)</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">수익 및 협찬 가치 요약</h2>
                        <div className="p-1 px-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg">LIVE</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">총 협찬(물품) 가치</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xl tracking-tight font-black text-slate-900 dark:text-white">{(data.revenue?.summary?.totalSponsorshipValue || 0).toLocaleString()}</span>
                                    <span className="text-xs font-black text-slate-400">원</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">총 고료 수익</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xl tracking-tight font-black text-blue-600 dark:text-blue-400">{(data.revenue?.summary?.totalAdFee || 0).toLocaleString()}</span>
                                    <span className="text-xs font-black text-blue-400/50">원</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 border-l border-slate-100 dark:border-slate-800 pl-4 bg-gradient-to-r from-slate-50/50 to-transparent dark:from-slate-800/20 py-1">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    예상 재판매 수익 <span className="text-[8px] bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-500">40%</span>
                                </span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xl tracking-tight font-black text-emerald-600 dark:text-emerald-400">+{Math.floor((data.revenue?.summary?.totalSponsorshipValue || 0) * 0.4).toLocaleString()}</span>
                                    <span className="text-xs font-black text-emerald-400/50">원</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-violet-600/80 dark:text-violet-400/80">순수익 (고료+재판매)</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-2xl tracking-tighter font-black text-violet-600 dark:text-violet-400">{((data.revenue?.summary?.totalAdFee || 0) + Math.floor((data.revenue?.summary?.totalSponsorshipValue || 0) * 0.4)).toLocaleString()}</span>
                                    <span className="text-sm font-black text-violet-400/50">원</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight gap-2 flex items-center">
                            투입 시간 대비 효율 (ROI)
                        </h2>
                        <div className="p-1 px-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-lg">ANALYSIS</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">총 투입 시간 (방문+작성)</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xl tracking-tight font-black text-slate-900 dark:text-white">{(data.revenue?.summary?.totalCampaigns || 0) * 3.5}</span>
                                    <span className="text-xs font-black text-slate-400">h</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">캠페인 진행 건수</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xl tracking-tight font-black text-slate-700 dark:text-slate-300">{data.revenue?.summary?.totalCampaigns || 0}</span>
                                    <span className="text-xs font-black text-slate-400">건</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4 border-l border-slate-100 dark:border-slate-800 pl-4 bg-gradient-to-r from-amber-50/30 to-transparent dark:from-amber-900/10 py-1">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">내 시급 가치 (최저시급 기준)</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-xl tracking-tight font-black text-rose-600 dark:text-rose-400">- {((data.revenue?.summary?.totalCampaigns || 0) * 3.5 * 9860).toLocaleString()}</span>
                                    <span className="text-xs font-black text-rose-400/50">원</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400/80">당신의 실제 시간당 이익</span>
                                <div className="flex items-baseline gap-0.5">
                                    <span className="text-2xl tracking-tighter font-black text-blue-600 dark:text-blue-400">
                                        {((data.revenue?.summary?.totalCampaigns || 0) > 0 ? Math.floor(((data.revenue?.summary?.totalAdFee || 0) + (data.revenue?.summary?.totalSponsorshipValue || 0)) / ((data.revenue?.summary?.totalCampaigns || 0) * 3.5)) : 0).toLocaleString()}
                                    </span>
                                    <span className="text-sm font-black text-blue-400/50">원/h</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm md:col-span-4 overflow-hidden relative">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">다가오는 캘린더 일정</h2>
                    <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-3 max-h-52 overflow-y-auto no-scrollbar">
                        {data.schedules.slice(0, 8).map((s) => (
                            <li key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span className="flex-1 font-black truncate">{s.custom_title || s.campaign?.title || "제목 없음"}</span>
                                <span className="text-[10px] font-black text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg">{(s.visit_date || s.deadline_date)?.slice(0, 10) || "-"}</span>
                            </li>
                        ))}
                        {!data.schedules.length && <li className="text-slate-400 py-10 text-center font-bold">등록된 일정이 없습니다.</li>}
                    </ul>
                </section>

                {/* Monthly Revenue Bar Chart */}
                {(data.revenue?.monthly ?? []).some(m => m.total > 0) && (
                    <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm md:col-span-3">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" /> 월별 수익 현황
                        </h2>
                        <div className="flex items-end gap-1.5 h-24">
                            {(data.revenue?.monthly ?? []).map((m) => {
                                const allTotals = (data.revenue?.monthly ?? []).map(x => x.total);
                                const maxTotal = Math.max(...allTotals, 1);
                                const pct = Math.round((m.total / maxTotal) * 100);
                                return (
                                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1" title={`${m.month}월: ${m.total.toLocaleString()}원`}>
                                        <div
                                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 rounded-t-lg transition-all duration-700"
                                            style={{ height: `${Math.max(pct, m.total > 0 ? 6 : 0)}%` }}
                                        />
                                        <span className="text-[8px] font-black text-slate-400">{m.month}월</span>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm md:col-span-3">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" /> 최근 알림 피드</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.notifications.slice(0, 6).map((n) => (
                            <div key={n.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700">
                                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mb-2">{n.message || "메시지 없음"}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{n.status}</span>
                                    <span className="text-[9px] font-black text-slate-400">JUST NOW</span>
                                </div>
                            </div>
                        ))}
                        {!data.notifications.length && <div className="col-span-full py-10 text-center text-slate-400 font-bold">새로운 알림이 없습니다.</div>}
                    </div>
                </section>
            </div>

            {/* PRO Membership & Donation Section */}
            <ProUpgradeSection />
        </div>
    );
}
