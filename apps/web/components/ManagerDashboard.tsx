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

    if (loading) return <div className="text-sm text-slate-500">로딩 중...</div>;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <section className="rounded-2xl border bg-white p-4">
                <h2 className="text-sm font-black text-slate-800">이번 달 정산 요약</h2>
                <p className="mt-2 text-xs text-slate-500">협찬가치: {data.revenue?.summary?.totalSponsorshipValue || 0}원</p>
                <p className="mt-1 text-xs text-slate-500">지급금액: {data.revenue?.summary?.totalAdFee || 0}원</p>
                <p className="mt-1 text-xs text-slate-500">캠페인 수: {data.revenue?.summary?.totalCampaigns || 0}</p>
            </section>

            <section className="rounded-2xl border bg-white p-4 md:col-span-2">
                <h2 className="text-sm font-black text-slate-800">다가오는 일정</h2>
                <ul className="mt-2 text-xs text-slate-700 space-y-2 max-h-52 overflow-y-auto">
                    {data.schedules.slice(0, 8).map((s) => (
                        <li key={s.id} className="flex justify-between">
                            <span className="max-w-[70%] truncate">{s.custom_title || s.campaign?.title || "제목 없음"}</span>
                            <span className="text-slate-500">{(s.visit_date || s.deadline_date)?.slice(0, 10) || "-"}</span>
                        </li>
                    ))}
                    {!data.schedules.length && <li className="text-slate-400">일정이 없습니다.</li>}
                </ul>
            </section>

            <section className="rounded-2xl border bg-white p-4 md:col-span-3">
                <h2 className="text-sm font-black text-slate-800">최근 알림</h2>
                <ul className="mt-2 text-xs text-slate-700 space-y-2 max-h-40 overflow-y-auto">
                    {data.notifications.slice(0, 12).map((n) => (
                        <li key={n.id} className="flex justify-between">
                            <span className="max-w-[70%] truncate">{n.message || "메시지 없음"}</span>
                            <span className="text-slate-500">{n.status}</span>
                        </li>
                    ))}
                    {!data.notifications.length && <li className="text-slate-400">알림이 없습니다.</li>}
                </ul>
            </section>
        </div>
    );
}
