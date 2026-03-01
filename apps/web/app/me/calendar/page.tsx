"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Bell, X, Sparkles } from "lucide-react";
import Link from "next/link";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: "예정", color: "text-blue-600", bg: "bg-blue-500" },
  PENDING: { label: "대기", color: "text-amber-600", bg: "bg-amber-500" },
  COMPLETED: { label: "완료", color: "text-emerald-600", bg: "bg-emerald-500" },
  URGENT: { label: "마감임박", color: "text-rose-600", bg: "bg-rose-500" },
};

type Schedule = {
  id: number;
  custom_title: string;
  visit_date: string;
  status: string;
};

const MOCK_SCHEDULES: Schedule[] = [
  { id: 1, custom_title: "성수동 카페 오마카세 체험", visit_date: "2026-03-05", status: "SCHEDULED" },
  { id: 2, custom_title: "청담동 프리미엄 헤어숍", visit_date: "2026-03-08", status: "PENDING" },
  { id: 3, custom_title: "강남역 스테이크 하우스", visit_date: "2026-03-12", status: "COMPLETED" },
  { id: 4, custom_title: "홍대 크래프트 비어 바", visit_date: "2026-03-15", status: "SCHEDULED" },
  { id: 5, custom_title: "판교 IT 플래그십 스토어", visit_date: "2026-03-20", status: "URGENT" },
  { id: 6, custom_title: "압구정 스킨케어 체험단", visit_date: "2026-03-22", status: "SCHEDULED" },
  { id: 7, custom_title: "잠실 복합 쇼핑몰 체험", visit_date: "2026-03-28", status: "PENDING" },
];

export default function CalendarPage() {
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    // Load from API or fallback to mock
    fetch("/api/me/board")
      .then(r => r.json())
      .then(d => setSchedules(d.schedules?.length ? d.schedules : MOCK_SCHEDULES))
      .catch(() => setSchedules(MOCK_SCHEDULES));
  }, []);

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const getSchedulesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return schedules.filter(s => s.visit_date?.startsWith(dateStr));
  };

  const selectedSchedules = selectedDay ? getSchedulesForDay(selectedDay) : [];

  const addSchedule = () => {
    if (!newTitle.trim() || !selectedDay) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
    setSchedules(prev => [...prev, {
      id: Date.now(),
      custom_title: newTitle,
      visit_date: dateStr,
      status: "SCHEDULED"
    }]);
    setNewTitle("");
    setShowAddModal(false);
  };

  const removeSchedule = (id: number) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const monthlyCount = schedules.filter(s => {
    const d = new Date(s.visit_date);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/me" className="text-[11px] font-black text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest mb-2 block">
              ← 내 매니저
            </Link>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-blue-600" />
              캠페인 캘린더
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">
              이번 달 <span className="text-blue-600 font-black">{monthlyCount}건</span>의 일정이 있습니다.
            </p>
          </div>
          <div className="flex items-center gap-4 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setCurrent(new Date(year, month - 1, 1))}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-black text-slate-900 dark:text-white px-2 min-w-[100px] text-center">
              {year}년 {month + 1}월
            </span>
            <button
              onClick={() => setCurrent(new Date(year, month + 1, 1))}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-800">
              {DAY_NAMES.map((d, i) => (
                <div key={d} className={`py-3 text-center text-[11px] font-black uppercase tracking-widest ${i === 0 ? "text-rose-500" : i === 6 ? "text-blue-500" : "text-slate-400 dark:text-slate-500"}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-px bg-slate-50 dark:bg-slate-800">
              {cells.map((day, idx) => {
                const daySchedules = day ? getSchedulesForDay(day) : [];
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = day === selectedDay;
                const col = idx % 7;

                return (
                  <div
                    key={idx}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    className={`min-h-[80px] p-2 bg-white dark:bg-slate-900 transition-all cursor-pointer group relative
                      ${day ? "hover:bg-blue-50/50 dark:hover:bg-blue-900/10" : "opacity-0 pointer-events-none"}
                      ${isSelected ? "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-500" : ""}
                    `}
                  >
                    {day && (
                      <>
                        <span className={`text-[12px] font-black w-6 h-6 flex items-center justify-center rounded-full mb-1
                          ${isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : ""}
                          ${isSelected && !isToday ? "text-blue-600" : ""}
                          ${!isToday && !isSelected ? (col === 0 ? "text-rose-500" : col === 6 ? "text-blue-500" : "text-slate-600 dark:text-slate-300") : ""}
                        `}>
                          {day}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          {daySchedules.slice(0, 2).map(s => {
                            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.SCHEDULED;
                            return (
                              <div key={s.id} className={`w-full h-1.5 rounded-full ${cfg.bg} opacity-80`} title={s.custom_title} />
                            );
                          })}
                          {daySchedules.length > 2 && (
                            <span className="text-[8px] font-black text-slate-400">+{daySchedules.length - 2}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Panel */}
          <div className="flex flex-col gap-4">
            {/* Selected Day Detail */}
            <AnimatePresence>
              {selectedDay ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {month + 1}월 {selectedDay}일
                    </h3>
                    <button
                      onClick={() => { setShowAddModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> 일정 추가
                    </button>
                  </div>

                  {selectedSchedules.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-600">
                      <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-[11px] font-bold">이 날은 일정이 없습니다</p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {selectedSchedules.map(s => {
                        const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.SCHEDULED;
                        return (
                          <li key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 group/item">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.bg}`} />
                            <span className="text-[11px] font-black text-slate-900 dark:text-white flex-1 truncate">{s.custom_title}</span>
                            <button onClick={() => removeSchedule(s.id)} className="opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-400 hover:text-rose-500">
                              <X className="w-3 h-3" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-center flex-1 flex flex-col items-center justify-center gap-3"
                >
                  <CalendarDays className="w-12 h-12 text-slate-200 dark:text-slate-700" />
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-600">날짜를 클릭하면<br/>일정을 확인할 수 있어요</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Upcoming List */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6">
              <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Bell className="w-3 h-3" /> 다가오는 일정
              </h3>
              <ul className="space-y-2">
                {schedules
                  .filter(s => new Date(s.visit_date) >= today)
                  .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime())
                  .slice(0, 4)
                  .map(s => {
                    const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.SCHEDULED;
                    const daysLeft = Math.ceil((new Date(s.visit_date).getTime() - today.getTime()) / 86400000);
                    return (
                      <li key={s.id} className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.bg}`} />
                        <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 flex-1 truncate">{s.custom_title}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${daysLeft <= 2 ? "bg-rose-50 dark:bg-rose-900/20 text-rose-500" : "bg-slate-50 dark:bg-slate-800 text-slate-400"}`}>
                          {daysLeft === 0 ? "오늘" : `D-${daysLeft}`}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>

            {/* Legend */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-4">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cfg.bg}`} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-8 w-full max-w-sm"
            >
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" />
                일정 추가
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mb-6">
                {month + 1}월 {selectedDay}일에 새 캠페인 일정을 등록합니다.
              </p>
              <input
                type="text"
                placeholder="캠페인 제목 입력..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSchedule()}
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={addSchedule}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                >
                  추가하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
