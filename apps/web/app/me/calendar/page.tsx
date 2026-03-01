"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Bell, X, Sparkles, Mail, MessageCircle, CalendarPlus, CheckCircle2, LayoutDashboard } from "lucide-react";
import Link from "next/link";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

// 세분화된 상태 관리
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  APPLIED: { label: "선발대기", color: "text-slate-600", bg: "bg-slate-400" },
  SELECTED: { label: "예약대기", color: "text-violet-600", bg: "bg-violet-500" },
  SCHEDULED: { label: "방문예정", color: "text-blue-600", bg: "bg-blue-500" },
  REVIEWING: { label: "리뷰대기", color: "text-amber-600", bg: "bg-amber-500" },
  URGENT: { label: "마감임박(D-2)", color: "text-rose-600", bg: "bg-rose-500" },
  COMPLETED: { label: "등록완료", color: "text-emerald-600", bg: "bg-emerald-500" },
};

type Schedule = {
  id: number;
  custom_title: string;
  visit_date: string;
  status: string;
};

export default function CalendarPage() {
  const [today] = useState(new Date());
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState("SCHEDULED");

  // 연동 상태 (로컬 토글 전환)
  const [syncStatus, setSyncStatus] = useState({
    kakao: true,
    email: false,
    google: false
  });

  useEffect(() => {
    // 동적 목업 데이터 생성 (이번 달 기준)
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');

    // API 호출 시도, 없으면 로컬 목업 사용
    fetch("/api/me/board")
      .then(r => r.json())
      .then(d => {
        // 기존 백엔드의 간단한 SCHEDULED 데이터 보존, 하지만 없는 경우 아래의 세분화 데이터 사용
        if (d.schedules && d.schedules.length > 5) {
          setSchedules(d.schedules);
        } else {
          setSchedules([
            { id: 1, custom_title: "[신청] 압구정 레스토랑", visit_date: `${y}-${m}-02`, status: "APPLIED" },
            { id: 2, custom_title: "[당첨] 성수 카페 (예약요망)", visit_date: `${y}-${m}-05`, status: "SELECTED" },
            { id: 3, custom_title: "[예약] 홍대 미용실 (14:00)", visit_date: `${y}-${m}-10`, status: "SCHEDULED" },
            { id: 4, custom_title: "[방문] 강남역 이자카야", visit_date: `${y}-${m}-15`, status: "REVIEWING" },
            { id: 5, custom_title: "[마감] 신촌 스터디카페 리뷰", visit_date: `${y}-${m}-18`, status: "URGENT" },
            { id: 6, custom_title: "[마감] 건대 무한리필 리뷰", visit_date: `${y}-${m}-20`, status: "URGENT" },
            { id: 7, custom_title: "[완료] 역삼 헬스장 1개월권", visit_date: `${y}-${m}-25`, status: "COMPLETED" },
            { id: 8, custom_title: "[완료] 수분크림 배송형", visit_date: `${y}-${m}-28`, status: "COMPLETED" },
          ]);
        }
      })
      .catch(() => {
        // Fallback
        setSchedules([
          { id: 1, custom_title: "[신청] 압구정 레스토랑", visit_date: `${y}-${m}-02`, status: "APPLIED" },
          { id: 2, custom_title: "[당첨] 성수 카페 (예약요망)", visit_date: `${y}-${m}-05`, status: "SELECTED" },
          { id: 3, custom_title: "[예약] 홍대 미용실 (14:00)", visit_date: `${y}-${m}-10`, status: "SCHEDULED" },
          { id: 4, custom_title: "[방문] 강남역 이자카야", visit_date: `${y}-${m}-15`, status: "REVIEWING" },
          { id: 5, custom_title: "[마감] 신촌 스터디카페 리뷰", visit_date: `${y}-${m}-18`, status: "URGENT" },
          { id: 6, custom_title: "[완료] 역삼 헬스장 1개월권", visit_date: `${y}-${m}-25`, status: "COMPLETED" },
        ]);
      });
  }, [current]);

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
      status: newStatus
    }]);
    setNewTitle("");
    setNewStatus("SCHEDULED");
    setShowAddModal(false);
  };

  const removeSchedule = (id: number) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const toggleSync = (provider: keyof typeof syncStatus) => {
    setSyncStatus(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const monthlyCount = schedules.filter(s => {
    const d = new Date(s.visit_date);
    return d.getFullYear() === year && d.getMonth() === month && s.status !== "COMPLETED";
  }).length;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <div>
            <Link href="/me" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors uppercase tracking-widest mb-3">
              <LayoutDashboard className="w-3.5 h-3.5" /> 대시보드 복귀
            </Link>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-blue-600" />
              스마트 캘린더
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">
              상태별 세분화된 일정을 통합 관리합니다. <span className="text-blue-600 font-black ml-1">잔여 {monthlyCount}건</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => setCurrent(new Date(year, month - 1, 1))}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm text-slate-600 dark:text-slate-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-base font-black text-slate-900 dark:text-white px-4 min-w-[120px] text-center tracking-tighter">
                {year}년 {month + 1}월
              </span>
              <button
                onClick={() => setCurrent(new Date(year, month + 1, 1))}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm text-slate-600 dark:text-slate-400"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="hidden md:flex items-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-slate-900/10 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> 새 일정
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            {/* Legend Map */}
            <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-wrap gap-2 items-center justify-center md:justify-start">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className={`w-2.5 h-2.5 rounded-full ${cfg.bg}`} />
                  <span className={`text-[10px] font-black ${cfg.color.replace('text-', 'text-opacity-80 dark:text-opacity-100 text-')}`}>{cfg.label}</span>
                </div>
              ))}
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 relative z-10">
              {DAY_NAMES.map((d, i) => (
                <div key={d} className={`py-3 text-center text-[11px] font-black uppercase tracking-widest ${i === 0 ? "text-rose-500" : i === 6 ? "text-blue-500" : "text-slate-400 dark:text-slate-500"}`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day Cells */}
            <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 flex-1">
              {cells.map((day, idx) => {
                const daySchedules = day ? getSchedulesForDay(day) : [];
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = day === selectedDay;
                const col = idx % 7;

                return (
                  <div
                    key={idx}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    className={`min-h-[120px] p-3 bg-white dark:bg-slate-900 transition-all duration-300 cursor-pointer group relative flex flex-col
                      ${day ? "hover:bg-slate-50/80 dark:hover:bg-slate-800/40" : "opacity-0 pointer-events-none"}
                      ${isSelected ? "ring-2 ring-inset ring-blue-500 bg-blue-50/30 dark:bg-blue-900/10 z-20 shadow-[0_0_20px_rgba(59,130,246,0.15)]" : ""}
                    `}
                  >
                    {day && (
                      <>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-300
                            ${isToday ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110" : "text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-slate-200"}
                            ${isSelected && !isToday ? "bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400" : ""}
                            ${!isToday && !isSelected ? (col === 0 ? "text-rose-400 group-hover:text-rose-500" : col === 6 ? "text-blue-400 group-hover:text-blue-500" : "") : ""}
                            `}>
                            {day}
                          </span>
                          {daySchedules.length > 0 && (
                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              {daySchedules.length}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 overflow-y-auto custom-scrollbar flex-1 pb-1">
                          {daySchedules.slice(0, 3).map(s => {
                            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.SCHEDULED;
                            return (
                              <div key={s.id} className={`w-full px-2 py-1.5 rounded-lg ${cfg.bg} bg-opacity-10 dark:bg-opacity-20 border border-transparent group-hover:bg-opacity-20 transition-all overflow-hidden relative`}>
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bg}`} />
                                <p className={`text-[10px] font-black truncate pl-1 ${cfg.color}`}>{s.custom_title}</p>
                              </div>
                            );
                          })}
                          {daySchedules.length > 3 && (
                            <p className="text-[9px] font-black text-slate-400 pl-1 mt-0.5">+ {daySchedules.length - 3}개 더보기</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Panel System */}
          <div className="flex flex-col gap-6">

            {/* Smart Sync Settings */}
            <div className="bg-gradient-to-br from-slate-900 to-black rounded-[2rem] border border-slate-800 shadow-2xl p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all" />
              <h3 className="text-sm font-black text-white mb-2 flex items-center gap-2 relative z-10">
                <Bell className="w-4 h-4 text-amber-400" /> 외부 알람 연동 (구독)
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mb-6 leading-relaxed">
                마감일, 당첨 여부 등 핵심 이벤트를 선호하는 채널로 100% 동기화하여 유지 관리합니다.
              </p>

              <div className="space-y-3 relative z-10">
                {/* Kakao */}
                <div
                  onClick={() => toggleSync("kakao")}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${syncStatus.kakao ? "bg-amber-400/10 border-amber-400/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${syncStatus.kakao ? "bg-[#FEE500]" : "bg-white/10"}`}>
                      <MessageCircle className={`w-4 h-4 ${syncStatus.kakao ? "text-amber-900 fill-current" : "text-white/40"}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-black ${syncStatus.kakao ? "text-amber-400" : "text-slate-300"}`}>카카오톡 봇 알림</span>
                      <span className="text-[9px] text-slate-500">실시간 D-Day 푸시</span>
                    </div>
                  </div>
                  {syncStatus.kakao && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>

                {/* Google Calendar */}
                <div
                  onClick={() => toggleSync("google")}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${syncStatus.google ? "bg-white border-slate-200" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${syncStatus.google ? "bg-slate-100" : "bg-white/10"}`}>
                      <CalendarPlus className={`w-4 h-4 ${syncStatus.google ? "text-blue-600" : "text-white/40"}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-black ${syncStatus.google ? "text-slate-900" : "text-slate-300"}`}>Google 캘린더 동기화</span>
                      <span className="text-[9px] text-slate-500">내 캘린더에 일정 자동 등록</span>
                    </div>
                  </div>
                  {syncStatus.google && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>

                {/* Email */}
                <div
                  onClick={() => toggleSync("email")}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${syncStatus.email ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${syncStatus.email ? "bg-blue-600" : "bg-white/10"}`}>
                      <Mail className={`w-4 h-4 ${syncStatus.email ? "text-white" : "text-white/40"}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-black ${syncStatus.email ? "text-blue-400" : "text-slate-300"}`}>이메일 리포트</span>
                      <span className="text-[9px] text-slate-500">매일 아침 8시 요약 메일</span>
                    </div>
                  </div>
                  {syncStatus.email && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </div>
              </div>
            </div>

            {/* Selected Day Detail */}
            <AnimatePresence mode="popLayout">
              {selectedDay ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 flex-1 flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-500 rounded-full" /> {month + 1}월 {selectedDay}일 상세
                    </h3>
                  </div>

                  {selectedSchedules.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-600 flex-1 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                        <CalendarDays className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                      </div>
                      <p className="text-[11px] font-bold">오프라인 일정이 비어있습니다</p>
                    </div>
                  ) : (
                    <ul className="space-y-3 flex-1 overflow-y-auto">
                      {selectedSchedules.map(s => {
                        const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.SCHEDULED;
                        return (
                          <li key={s.id} className={`flex flex-col gap-2 p-4 rounded-2xl border transition-all ${cfg.bg} bg-opacity-5 dark:bg-opacity-10 border-${cfg.color.split('-')[1]}-200 dark:border-${cfg.color.split('-')[1]}-900 group/item relative overflow-hidden`}>
                            <div className="flex justify-between items-start">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md text-white ${cfg.bg}`}>{cfg.label}</span>
                              <button onClick={() => removeSchedule(s.id)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all shadow-sm">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 mt-1">{s.custom_title}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> 커스텀 일정 등록하기
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 text-center flex-1 flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-blue-500/20">
                    <CalendarDays className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-black dark:text-white text-slate-900 mt-2">일자별 현미경 뷰</h4>
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-2">달력에서 날짜를 선택하시면<br />해당 일의 세부 미션을 관리할 수 있습니다.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Add Custom Schedule Modal */}
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
                선택 일자 일정 등록
              </h3>
              <p className="text-[11px] font-bold text-slate-400 mb-6">
                선택된 일자는 <span className="text-blue-500">{month + 1}월 {selectedDay}일</span>입니다.
              </p>

              {/* Type Selection */}
              <div className="mb-4">
                <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase">상태 지정</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(STATUS_CONFIG).map((key) => {
                    const cfg = STATUS_CONFIG[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setNewStatus(key)}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all border ${newStatus === key ? cfg.bg + " text-white border-transparent shadow-md" : "bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <label className="text-[10px] font-black text-slate-400 mb-2 block uppercase mt-4">일정 요약문</label>
              <input
                type="text"
                placeholder="예: 강남역 고기집 방문 예약"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addSchedule()}
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white mb-6"
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
                  disabled={!newTitle.trim()}
                  className="flex-1 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                >
                  등록하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
