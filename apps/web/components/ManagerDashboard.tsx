"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, TrendingUp } from "lucide-react";
import ProUpgradeSection from "./ProUpgradeSection";

type BoardSchedule = {
  id: number;
  custom_title: string | null;
  visit_date: string | null;
  deadline_date: string | null;
  status: string;
  campaign?: { title: string; platform?: { name: string } | null } | null;
};

type BoardMonthly = { month: number; sponsorship: number; ad_fee: number; total: number; count: number };

type BoardPayload = {
  summary?: { totalSponsorshipValue: number; totalAdFee: number; totalCampaigns: number };
  month?: string;
  monthly?: BoardMonthly[];
  schedules?: BoardSchedule[];
  notifications?: Array<{ id: number; message?: string | null; status: string }>;
};

const toMoney = (value: number) => value.toLocaleString();

const statusLabel = (status: string) => {
  switch (status) {
    case "APPLIED":
      return "지원";
    case "SELECTED":
      return "선정";
    case "SCHEDULED":
      return "예정";
    case "REVIEWING":
      return "리뷰중";
    case "COMPLETED":
      return "완료";
    default:
      return status;
  }
};

export default function ManagerDashboard({ userId }: { userId: number }) {
  const [data, setData] = useState<BoardPayload>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/me/board?userId=${userId}`);
        if (!res.ok) throw new Error(`데이터를 불러오지 못했습니다. (${res.status})`);
        const json = (await res.json()) as BoardPayload;
        if (!canceled) setData(json);
      } catch (e: unknown) {
        if (!canceled) setError(e instanceof Error ? e.message : "데이터를 불러오지 못했습니다.");
      } finally {
        if (!canceled) setLoading(false);
      }
    };
    run();
    return () => {
      canceled = true;
    };
  }, [userId]);

  const summary = data.summary || { totalSponsorshipValue: 0, totalAdFee: 0, totalCampaigns: 0 };
  const monthly = data.monthly || [];
  const schedules = data.schedules || [];
  const notifications = data.notifications || [];

  const monthlyMax = useMemo(() => {
    const max = Math.max(0, ...monthly.map((m) => m.total));
    return max || 1;
  }, [monthly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-[9px] font-black tracking-widest uppercase shadow-lg shadow-blue-500/20">
              대시보드
            </span>
            <Link href="/me/console" className="flex items-center gap-2 group">
              <span className="w-2 h-2 bg-emerald-500 rounded-full group-hover:animate-ping" />
              <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-500 transition-colors uppercase tracking-widest leading-none">
                콘솔 열기
              </span>
            </Link>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
            사용자 관리
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 text-xl">
              오늘의 리뷰 상태
            </span>
          </h1>
          {error ? <p className="mt-3 text-sm font-bold text-rose-600">{error}</p> : null}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href={`/me/calendar?userId=${userId}`}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-xs font-black text-slate-700 dark:text-slate-200 hover:border-blue-300"
          >
            <CalendarDays className="w-4 h-4 text-blue-600" />
            캘린더
          </Link>
          <Link
            href={`/me/notifications?userId=${userId}`}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm text-xs font-black text-slate-700 dark:text-slate-200 hover:border-blue-300"
          >
            <Bell className="w-4 h-4 text-blue-600" />
            알림
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">실적 요약</h2>
            <div className="p-1 px-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg">
              LIVE
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">총 협찬 금액</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-2">{toMoney(summary.totalSponsorshipValue)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">총 광고비</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-2">{toMoney(summary.totalAdFee)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">총 캠페인</p>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-2">{summary.totalCampaigns}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm md:col-span-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> 월별 추이
          </h2>
          <div className="flex items-end gap-1.5 h-24">
            {monthly.map((m) => {
              const pct = Math.round((m.total / monthlyMax) * 100);
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1" title={`M${m.month} ${toMoney(m.total)}`}>
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 dark:from-blue-500 dark:to-blue-300 rounded-t-lg transition-all duration-700"
                    style={{ height: `${Math.max(pct, m.total > 0 ? 6 : 0)}%` }}
                  />
                  <span className="text-[8px] font-black text-slate-400">{m.month}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm md:col-span-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">다가오는 일정</h2>
          <ul className="text-[11px] text-slate-700 dark:text-slate-300 space-y-3 max-h-52 overflow-y-auto no-scrollbar">
            {schedules.slice(0, 8).map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30 transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="flex-1 font-black truncate">{s.custom_title || s.campaign?.title || "제목 없음"}</span>
                <span className="text-[10px] font-black text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg">
                  {(s.visit_date || s.deadline_date)?.slice(0, 10) || "-"}
                </span>
                <span className="text-[9px] font-black text-slate-400">{statusLabel(s.status)}</span>
              </li>
            ))}
            {!schedules.length ? <li className="text-slate-400 py-10 text-center font-bold">등록된 일정이 없습니다.</li> : null}
          </ul>
        </section>

        <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" /> 최근 알림
            </h2>
            <Link href={`/me/notifications?userId=${userId}`} className="text-[10px] font-black text-blue-600 hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notifications.slice(0, 6).map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700"
              >
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mb-2">{n.message || "메시지 없음"}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{n.status}</span>
                  <span className="text-[9px] font-black text-slate-400">상세</span>
                </div>
              </div>
            ))}
            {!notifications.length ? <div className="col-span-full py-10 text-center text-slate-400 font-bold">알림이 없습니다.</div> : null}
          </div>
        </section>
      </div>

      <ProUpgradeSection />
    </div>
  );
}
