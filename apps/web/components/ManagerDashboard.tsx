"use client";

import { useEffect, useState } from "react";

type DashboardPayload = {
    schedules: any[];
    revenue: any;
    notifications: any[];
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
                revenue: board?.summary ? { summary: board.summary, month: board.month } : null,
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
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">수익 및 협찬 요약</h2>
                        <div className="p-1 px-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg">LIVE</div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">총 협찬 가치</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">{(data.revenue?.summary?.totalSponsorshipValue || 0).toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">총 고료 수익</span>
                            <span className="text-lg font-black text-blue-600 dark:text-blue-400">{(data.revenue?.summary?.totalAdFee || 0).toLocaleString()}원</span>
                        </div>
                        <div className="pt-3 border-t border-slate-50 dark:border-slate-800 flex justify-between">
                            <span className="text-[11px] font-bold text-slate-400">진행 캠페인</span>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{data.revenue?.summary?.totalCampaigns || 0}건</span>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm md:col-span-2 overflow-hidden relative">
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

                <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm md:col-span-3">
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">최근 알림 피드</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.notifications.slice(0, 6).map((n) => (
                            <div key={n.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 md:col-span-1">
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

            {/* Premium/Monetization Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-sm font-black uppercase tracking-widest mb-1">PRO Membership</h3>
                        <p className="text-[11px] font-bold opacity-80 mb-4">전국 단위 캠페인 우선 매칭 및 캘린더 동기화 기능을 잠금 해제하세요.</p>
                        <button className="px-5 py-2.5 bg-white text-blue-600 rounded-xl text-[10px] font-black shadow-lg hover:scale-105 active:scale-95 transition-all">업그레이드 하기</button>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                </div>

                <div className="p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 group hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">개발 후원하기 (Buy me a coffee)</h3>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center">서비스의 지속적인 고도화를 위해 소중한 커피 한 잔을 후원해주세요.</p>
                    <button className="mt-2 px-5 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95">토스페이로 후원하기</button>
                </div>
            </div>
        </div>
    );
}
