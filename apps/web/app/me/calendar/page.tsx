"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, Plus, Bell, X, Sparkles, Mail, MessageCircle, CalendarPlus, CheckCircle2, LayoutDashboard, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

type SearchParamBag = {
  userId?: string;
  focusDate?: string;
  highlightScheduleId?: string;
};

type StatusKey = "APPLIED" | "SELECTED" | "SCHEDULED" | "REVIEWING" | "URGENT" | "COMPLETED";

type ScheduleItem = {
  id: number;
  custom_title: string | null;
  status: StatusKey | string;
  visit_date: string | null;
  deadline_date: string | null;
  created_at: string;
  memo?: string | null;
  alarm_enabled?: boolean;
  sponsorship_value?: number | null;
  ad_fee?: number | null;
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const STATUS_CONFIG: Record<StatusKey, { label: string; dot: string; badgeBg: string; badgeText: string }> = {
  APPLIED: { label: "지원완료", dot: "bg-slate-400", badgeBg: "bg-slate-50 dark:bg-slate-800/40", badgeText: "text-slate-600 dark:text-slate-400" },
  SELECTED: { label: "선정됨", dot: "bg-violet-500", badgeBg: "bg-violet-50 dark:bg-violet-900/20", badgeText: "text-violet-600 dark:text-violet-400" },
  SCHEDULED: { label: "방문예정", dot: "bg-blue-500", badgeBg: "bg-blue-50 dark:bg-blue-900/20", badgeText: "text-blue-600 dark:text-blue-400" },
  REVIEWING: { label: "리뷰작성", dot: "bg-amber-500", badgeBg: "bg-amber-50 dark:bg-amber-900/20", badgeText: "text-amber-600 dark:text-amber-400" },
  URGENT: { label: "마감임박", dot: "bg-rose-500", badgeBg: "bg-rose-50 dark:bg-rose-900/20", badgeText: "text-rose-600 dark:text-rose-400" },
  COMPLETED: { label: "진행완료", dot: "bg-emerald-500", badgeBg: "bg-emerald-50 dark:bg-emerald-900/20", badgeText: "text-emerald-600 dark:text-emerald-400" },
};

const statusKeys = Object.keys(STATUS_CONFIG) as StatusKey[];

const pad2 = (value: number) => String(value).padStart(2, "0");

const parseDateKey = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map((x) => Number.parseInt(x, 10));
  if (!y || !m || !d) return null;
  const parsed = new Date(y, m - 1, d);
  if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) return null;
  return { year: y, month: m - 1, day: d };
};

const formatDateKey = (year: number, month: number, day: number) => `${year}-${pad2(month)}-${pad2(day)}`;

const isDateInMonth = (date: string | null, year: number, month: number) => {
  if (!date) return false;
  const parsed = new Date(date);
  return parsed.getFullYear() === year && parsed.getMonth() === month;
};

const toUtcMidnightIso = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map((v) => Number.parseInt(v, 10));
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString();
};

const formatMonthLabel = (year: number, month: number) => `${year}. ${pad2(month)}.`;

export default function CalendarPage({ searchParams }: { searchParams?: SearchParamBag }) {
  const userId = Number.parseInt(searchParams?.userId || "1", 10);
  const focusDate = searchParams?.focusDate?.trim() || null;
  const focusScheduleId = Number.parseInt(searchParams?.highlightScheduleId || "", 10);
  const parsedFocusDate = useMemo(() => (focusDate ? parseDateKey(focusDate) : null), [focusDate]);
  const focusDateIsInvalid = useMemo(() => focusDate !== null && !parsedFocusDate, [focusDate, parsedFocusDate]);
  const focusScheduleIdValue = Number.isInteger(focusScheduleId) ? focusScheduleId : null;
  const currentDate = new Date();
  const [current, setCurrent] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<StatusKey>("SCHEDULED");
  const [syncStatus, setSyncStatus] = useState({ kakao: true, google: false, email: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const highlightedItemRef = useRef<HTMLLIElement | null>(null);
  const [editForm, setEditForm] = useState({
    custom_title: "",
    status: "SCHEDULED",
    visit_date: "",
    deadline_date: "",
    sponsorship_value: "",
    ad_fee: "",
    memo: "",
    alarm_enabled: true,
  });

  const loadSchedules = useCallback(async () => {
    if (!Number.isFinite(userId)) {
      setError("유효하지 않은 사용자 ID입니다.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/me/schedules?userId=${userId}`);
      if (!res.ok) {
        throw new Error("일정 목록을 불러오지 못했습니다.");
      }
      const data = (await res.json()) as ScheduleItem[];
      setSchedules(data);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (!parsedFocusDate) return;
    setCurrent(new Date(parsedFocusDate.year, parsedFocusDate.month, 1));
    setSelectedDay(parsedFocusDate.day);
    setSearchKeyword("");
  }, [parsedFocusDate]);

  const focusScheduleFromAll = useMemo(() => {
    if (!focusScheduleIdValue) return null;
    return schedules.find((item) => item.id === focusScheduleIdValue) || null;
  }, [focusScheduleIdValue, schedules]);

  const focusScheduleDate = useMemo(() => {
    if (!focusScheduleFromAll) return null;
    const seed = focusScheduleFromAll.visit_date || focusScheduleFromAll.deadline_date;
    if (!seed) return null;
    return parseDateKey(seed.slice(0, 10));
  }, [focusScheduleFromAll]);

  useEffect(() => {
    if (!focusScheduleIdValue || parsedFocusDate) return;
    if (!focusScheduleDate) return;
    const target = focusScheduleDate;
    setCurrent(new Date(target.year, target.month, 1));
    setSelectedDay(target.day);
    setSearchKeyword("");
  }, [focusScheduleIdValue, focusScheduleDate, parsedFocusDate]);


  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthlySchedule = useMemo(
    () =>
      schedules.filter((schedule) => {
        return isDateInMonth(schedule.visit_date, year, month) || isDateInMonth(schedule.deadline_date, year, month);
      }),
    [schedules, year, month],
  );

  const getSchedulesForDay = (day: number) => {
    const key = formatDateKey(year, month + 1, day);
    return monthlySchedule.filter((s) => s.visit_date?.startsWith(key) || s.deadline_date?.startsWith(key));
  };

  const selectedSchedules = selectedDay ? getSchedulesForDay(selectedDay) : [];
  const filteredSelectedSchedules = selectedSchedules.filter((item) =>
    searchKeyword ? (item.custom_title || "").toLowerCase().includes(searchKeyword.toLowerCase()) : true,
  );
  const displayedSelectedSchedules = useMemo(() => {
    if (!focusScheduleIdValue) return filteredSelectedSchedules;
    if (filteredSelectedSchedules.some((item) => item.id === focusScheduleIdValue)) {
      return [...filteredSelectedSchedules];
    }
    const focused = selectedSchedules.find((item) => item.id === focusScheduleIdValue);
    if (!focused) return [...filteredSelectedSchedules];
    return [focused, ...filteredSelectedSchedules];
  }, [focusScheduleIdValue, filteredSelectedSchedules, selectedSchedules]);

  const isFocusScheduleFilteredOut = useMemo(() => {
    if (!focusScheduleIdValue || !selectedDay || !searchKeyword) return false;
    if (!focusScheduleFromAll) return false;
    return !filteredSelectedSchedules.some((item) => item.id === focusScheduleIdValue);
  }, [focusScheduleFromAll, filteredSelectedSchedules, focusScheduleIdValue, selectedDay, searchKeyword]);

  const isFocusDayVisible = useMemo(() => {
    if (!focusScheduleFromAll || !focusScheduleDate) return false;
    return focusScheduleDate.year === year && focusScheduleDate.month === month && focusScheduleDate.day === selectedDay;
  }, [focusScheduleFromAll, focusScheduleDate, selectedDay, year, month]);

  const focusDetailLabel = useMemo(() => {
    if (!focusScheduleIdValue || !focusScheduleFromAll) return "";
    const scheduleType = focusScheduleFromAll.visit_date ? "방문일" : focusScheduleFromAll.deadline_date ? "마감일" : "일정일";
    const dateText = focusScheduleFromAll.visit_date
      ? focusScheduleFromAll.visit_date.slice(0, 10)
      : focusScheduleFromAll.deadline_date
        ? focusScheduleFromAll.deadline_date.slice(0, 10)
        : "-";
    return `${scheduleType}: ${dateText}`;
  }, [focusScheduleFromAll, focusScheduleIdValue]);

  const focusStatusMessage = useMemo(() => {
    if (focusDateIsInvalid) return "focusDate 값이 유효하지 않습니다. 기본 월간 뷰로 열었습니다.";
    if (!focusScheduleIdValue) return null;
    if (loading) return "연결된 일정을 불러오는 중...";
    if (!focusScheduleFromAll) return "연결된 일정을 찾지 못해 현재 월간 뷰로 이동했습니다.";
    if (isFocusScheduleFilteredOut) return "검색 필터로 인해 연결된 일정이 숨겨져 있어 임시로 다시 표시합니다.";
    return null;
  }, [focusDateIsInvalid, focusScheduleIdValue, focusScheduleFromAll, isFocusScheduleFilteredOut, loading]);

  useEffect(() => {
    if (!focusScheduleIdValue || !selectedDay) return;
    const hasTarget = selectedSchedules.some((item) => item.id === focusScheduleIdValue);
    if (!hasTarget) return;
    requestAnimationFrame(() => {
      highlightedItemRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }, [focusScheduleIdValue, selectedSchedules]);

  const monthlyCount = monthlySchedule.filter((s) => s.status !== "COMPLETED").length;

  const addSchedule = async () => {
    const title = newTitle.trim();
    if (!title || !selectedDay) return;
    setError(null);
    try {
      const visitDateKey = formatDateKey(year, month + 1, selectedDay);
      const visitDate = toUtcMidnightIso(visitDateKey);
      const res = await fetch("/api/me/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          custom_title: title,
          status: newStatus,
          visit_date: visitDate,
        }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "일정 저장에 실패했습니다.");
      }
      setNewTitle("");
      setNewStatus("SCHEDULED");
      setShowAddModal(false);
      await loadSchedules();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "일정 저장에 실패했습니다.");
    }
  };

  const removeSchedule = async (id: number) => {
    try {
      const res = await fetch(`/api/me/schedules/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "일정 삭제에 실패했습니다.");
      }
      await loadSchedules();
      if (selectedDay && getSchedulesForDay(selectedDay).length === 1) {
        setSelectedDay(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "일정 삭제에 실패했습니다.");
    }
  };

  const toggleSync = (provider: keyof typeof syncStatus) => {
    setSyncStatus((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const openEdit = (item: ScheduleItem) => {
    setEditing(item);
    setEditForm({
      custom_title: item.custom_title || "",
      status: String(item.status || "SCHEDULED"),
      visit_date: item.visit_date ? item.visit_date.slice(0, 10) : "",
      deadline_date: item.deadline_date ? item.deadline_date.slice(0, 10) : "",
      sponsorship_value: item.sponsorship_value !== null && item.sponsorship_value !== undefined ? String(item.sponsorship_value) : "",
      ad_fee: item.ad_fee !== null && item.ad_fee !== undefined ? String(item.ad_fee) : "",
      memo: item.memo || "",
      alarm_enabled: item.alarm_enabled !== false,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditSaving(true);
    setError(null);
    try {
      const visitIso = editForm.visit_date ? toUtcMidnightIso(editForm.visit_date) : null;
      const deadlineIso = editForm.deadline_date ? toUtcMidnightIso(editForm.deadline_date) : null;

      const res = await fetch(`/api/me/schedules/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_title: editForm.custom_title.trim() || null,
          status: editForm.status,
          visit_date: visitIso,
          deadline_date: deadlineIso,
          sponsorship_value: editForm.sponsorship_value ? Number.parseInt(editForm.sponsorship_value, 10) : 0,
          ad_fee: editForm.ad_fee ? Number.parseInt(editForm.ad_fee, 10) : 0,
          memo: editForm.memo.trim() || null,
          alarm_enabled: Boolean(editForm.alarm_enabled),
        }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "일정 수정에 실패했습니다.");
      }

      setEditing(null);
      await loadSchedules();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "일정 수정에 실패했습니다.");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 transition-colors">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800/50 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-600/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <Link
              href="/me"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 hover:bg-slate-900 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all uppercase tracking-widest mb-4 border border-transparent shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
              <CalendarDays className="w-10 h-10 text-blue-600 dark:text-blue-500 drop-shadow-xl" />
              <span>Activity <span className="text-blue-600 dark:text-blue-400">Calendar</span></span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-2">
              Manage your campaign schedules in one place. <span className="inline-flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-[11px] border border-blue-100 dark:border-blue-800/50">Pending: {monthlyCount}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 mt-6 md:mt-0 relative z-10">
            <div className="flex items-center gap-1 p-1.5 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-inner">
              <button
                onClick={() => setCurrent(new Date(year, month - 1, 1))}
                className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm text-slate-600 dark:text-slate-400 active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-black text-slate-900 dark:text-white px-6 min-w-[150px] text-center tracking-tighter">
                {formatMonthLabel(year, month + 1)}
              </span>
              <button
                onClick={() => setCurrent(new Date(year, month + 1, 1))}
                className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm text-slate-600 dark:text-slate-400 active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2.5 px-7 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[13px] font-black shadow-2xl shadow-slate-900/20 dark:shadow-blue-900/30 hover:shadow-blue-500/40 hover:-translate-y-1 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 bg-white/50 dark:bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-hidden flex flex-col relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="p-5 border-b border-slate-100 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 flex flex-wrap gap-3 items-center justify-center md:justify-start relative z-10">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-800/80 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} />
                  <span className={`text-[10px] font-black ${cfg.badgeText}`}>{cfg.label}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
              {DAY_NAMES.map((day, i) => (
                <div key={day} className={`py-3 text-center text-[11px] font-black uppercase tracking-widest ${i === 0 ? "text-rose-500" : i === 6 ? "text-blue-500" : "text-slate-400 dark:text-slate-500"}`}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 flex-1">
              {cells.map((day, idx) => {
                const daySchedules = day ? getSchedulesForDay(day) : [];
                const isToday = day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear();
                const isSelected = day === selectedDay;
                const col = idx % 7;
                const isFocusedCell = day ? daySchedules.some((schedule) => schedule.id === focusScheduleIdValue) : false;
                const focusedScheduleInCell = isFocusedCell
                  ? daySchedules.find((schedule) => schedule.id === focusScheduleIdValue)
                  : null;
                const cellFocusTooltip = focusedScheduleInCell
                  ? `연결된 일정: ${focusedScheduleInCell.custom_title || "(제목 없음)"}`
                  : "일정 없음";

                return (
                  <div
                    key={idx}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    title={isFocusedCell ? cellFocusTooltip : undefined}
                    className={`min-h-[130px] p-3 bg-white dark:bg-slate-900 transition-all duration-300 cursor-pointer group relative flex flex-col border-r border-b border-slate-50 dark:border-slate-800/50
                      ${day ? "hover:bg-slate-50/80 dark:hover:bg-slate-800/40" : "opacity-0 pointer-events-none"}
                      ${isFocusedCell ? "ring-2 ring-blue-400/75 ring-offset-1 bg-blue-50/25 dark:bg-blue-900/15" : ""}
                      ${isSelected ? "bg-blue-50/30 dark:bg-blue-900/10 z-20 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)]" : ""}
                    `}
                  >
                    {day && (
                      <>
                        <div className="flex justify-between items-start mb-2.5">
                          <span
                            className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-500
                            ${isToday ? "bg-slate-900 dark:bg-blue-600 text-white shadow-lg shadow-black/10 dark:shadow-blue-900/20 scale-110" : "text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-slate-200"}
                            ${isSelected && !isToday ? "bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-black" : ""}
                            ${!isToday && !isSelected ? (col === 0 ? "text-rose-400 group-hover:text-rose-500" : col === 6 ? "text-blue-400 group-hover:text-blue-500" : "") : ""}
                          `}
                          >
                            {day}
                          </span>
                          {daySchedules.length > 0 ? (
                            <span
                              className={`text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg transition-all duration-300 ${isFocusedCell
                                ? "border border-blue-200 text-blue-600 dark:text-blue-300 opacity-100 bg-blue-50/70 dark:bg-blue-900/30 shadow-sm"
                                : "opacity-40 group-hover:opacity-100"
                                }`}
                            >
                              {isFocusedCell ? "★ " : ""}
                              {daySchedules.length}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-1.5 overflow-hidden flex-1">
                          {daySchedules.slice(0, 3).map((schedule) => {
                            const status = (Object.prototype.hasOwnProperty.call(STATUS_CONFIG, schedule.status) ? (schedule.status as StatusKey) : "SCHEDULED");
                            const cfg = STATUS_CONFIG[status];
                            const isFocusedSchedule = focusScheduleIdValue !== null && schedule.id === focusScheduleIdValue;
                            return (
                              <div
                                key={schedule.id}
                                title={schedule.custom_title || "(제목 없음)"}
                                className={`relative w-full px-2.5 py-1.5 rounded-xl border border-transparent ${cfg.badgeBg} transition-all duration-300 hover:scale-[1.02] hover:shadow-sm ${cfg.badgeText} group/item`}
                              >
                                <div className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full ${cfg.dot} opacity-70`} />
                                <p className="text-[10px] font-black truncate flex items-center gap-1 pl-1">
                                  {isFocusedSchedule ? <span className="text-blue-600">🎯</span> : null}
                                  {schedule.custom_title || "(제목 없음)"}
                                </p>
                              </div>
                            );
                          })}
                          {daySchedules.length > 3 ? (
                            <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 pl-1 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              + {daySchedules.length - 3} more
                            </p>
                          ) : null}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/90 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-slate-800/50 shadow-2xl p-7 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-blue-600/20 transition-all duration-700" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-600/5 rounded-full blur-[40px] pointer-events-none" />

              <h3 className="text-sm font-black text-white mb-2.5 flex items-center gap-2.5 relative z-10">
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                외부 일정 동기화
              </h3>
              <p className="text-[10px] text-slate-400 font-bold mb-8 leading-relaxed relative z-10 px-0.5">
                카카오톡, 구글 캘린더 등 외부 채널과 실시간 일정을 동기화하여 중요한 마감일을 놓치지 마세요.
              </p>

              <div className="space-y-3.5 relative z-10">
                <button
                  onClick={() => toggleSync("kakao")}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${syncStatus.kakao ? "bg-[#FEE500]/10 border-[#FEE500]/30 shadow-lg shadow-[#FEE500]/5" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-500 ${syncStatus.kakao ? "bg-[#FEE500] rotate-3 shadow-md" : "bg-white/10"}`}>
                      <MessageCircle className={`w-4 h-4 ${syncStatus.kakao ? "text-amber-900 fill-current" : "text-white/40"}`} />
                    </div>
                    <span className={`text-[11px] font-black tracking-tight ${syncStatus.kakao ? "text-[#FEE500]" : "text-slate-400"}`}>카카오 비즈니스</span>
                  </div>
                  {syncStatus.kakao ? <CheckCircle2 className="w-4 h-4 text-[#FEE500]" /> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                </button>

                <button
                  onClick={() => toggleSync("google")}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${syncStatus.google ? "bg-white/10 border-blue-400/30 shadow-lg shadow-blue-500/5" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-500 ${syncStatus.google ? "bg-white rotate-3 shadow-md" : "bg-white/10"}`}>
                      <CalendarPlus className={`w-4 h-4 ${syncStatus.google ? "text-blue-600" : "text-white/40"}`} />
                    </div>
                    <span className={`text-[11px] font-black tracking-tight ${syncStatus.google ? "text-white" : "text-slate-400"}`}>구글 워크스페이스</span>
                  </div>
                  {syncStatus.google ? <CheckCircle2 className="w-4 h-4 text-blue-400" /> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                </button>

                <button
                  onClick={() => toggleSync("email")}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${syncStatus.email ? "bg-blue-500/10 border-blue-500/30 shadow-lg shadow-blue-500/5" : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"}`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-500 ${syncStatus.email ? "bg-blue-600 rotate-3 shadow-md" : "bg-white/10"}`}>
                      <Mail className={`w-4 h-4 ${syncStatus.email ? "text-white" : "text-white/40"}`} />
                    </div>
                    <span className={`text-[11px] font-black tracking-tight ${syncStatus.email ? "text-blue-400" : "text-slate-400"}`}>다이렉트 메일링</span>
                  </div>
                  {syncStatus.email ? <CheckCircle2 className="w-4 h-4 text-blue-400" /> : <div className="w-4 h-4 rounded-full border border-white/10" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
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
                      <div className="w-2 h-6 bg-blue-500 rounded-full" /> {month + 1}월 {selectedDay}일 일정
                    </h3>
                    {focusDetailLabel ? <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{focusDetailLabel}</p> : null}
                    {!isFocusDayVisible && focusScheduleFromAll ? (
                      <p className="text-[10px] text-amber-600 mt-1">현재 연결된 일정의 날짜와 다른 날을 보고 있습니다.</p>
                    ) : null}
                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      닫기
                    </button>
                  </div>
                  <div className="relative mb-4">
                    <input
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800"
                      placeholder="해당 날짜 일정 검색"
                    />
                    <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <p className="text-xs text-slate-400">불러오는 중...</p>
                    ) : displayedSelectedSchedules.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-600 flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                          <CalendarDays className="w-6 h-6 text-slate-300 dark:text-slate-500" />
                        </div>
                        <p className="text-[11px] font-bold">이 날짜에 일정이 없습니다.</p>
                      </div>
                    ) : (
                      <ul className="space-y-4 pr-1">
                        {displayedSelectedSchedules.map((schedule) => {
                          const status = Object.prototype.hasOwnProperty.call(STATUS_CONFIG, schedule.status)
                            ? (schedule.status as StatusKey)
                            : "SCHEDULED";
                          const cfg = STATUS_CONFIG[status];
                          const isFocused = focusScheduleIdValue !== null && schedule.id === focusScheduleIdValue;
                          const focusStyle = isFocused ? "ring-2 ring-blue-500 ring-offset-4 ring-offset-white dark:ring-offset-slate-900 shadow-2xl shadow-blue-500/20 scale-[1.02]" : "hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none";
                          return (
                            <motion.li
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              key={schedule.id}
                              ref={isFocused ? (el) => { highlightedItemRef.current = el; } : undefined}
                              className={`flex flex-col gap-3 p-5 rounded-[1.5rem] border bg-white dark:bg-slate-800/40 transition-all duration-300 ${focusStyle}`}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.badgeText}`}>{cfg.label}</span>
                                  {isFocused && (
                                    <span className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[8px] font-black animate-pulse uppercase tracking-tighter">Linked Target</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => openEdit(schedule)}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-all"
                                  >
                                    <Plus className="w-3.5 h-3.5 rotate-45" />
                                  </button>
                                  <button
                                    onClick={() => removeSchedule(schedule.id)}
                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all shadow-sm"
                                    aria-label="일정 삭제"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              <span className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 mt-1">{schedule.custom_title || "(제목 없음)"}</span>
                              <span className="text-[10px] text-slate-500">
                                방문일: {schedule.visit_date ? schedule.visit_date.slice(0, 10) : "-"} | 마감일: {schedule.deadline_date ? schedule.deadline_date.slice(0, 10) : "-"}
                              </span>
                            </motion.li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                  {focusStatusMessage ? (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-3 py-2 text-[11px] font-black">
                      {focusStatusMessage}
                    </p>
                  ) : null}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> 항목 추가
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-6"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] p-10 w-full max-w-md relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">새 일정 등록</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{month + 1}월 {selectedDay}일 일정 등록</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 mb-3 block uppercase tracking-widest pl-1">상태 선택</label>
                    <div className="flex flex-wrap gap-2">
                      {statusKeys.map((key) => {
                        const cfg = STATUS_CONFIG[key];
                        const active = newStatus === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setNewStatus(key)}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all border duration-300 ${active ? "bg-slate-900 dark:bg-blue-600 text-white border-transparent shadow-xl shadow-blue-500/20" : "bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"}`}
                          >
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 mb-3 block uppercase tracking-widest pl-1">캠페인 제목 / 메모</label>
                    <div className="relative group">
                      <input
                        type="text"
                        placeholder="캠페인명 또는 메모를 입력하세요"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSchedule()}
                        autoFocus
                        className="w-full pl-5 pr-5 py-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl text-[13px] font-black outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 dark:focus:border-blue-500 text-slate-900 dark:text-white transition-all shadow-inner group-hover:border-slate-300 dark:group-hover:border-slate-600"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 relative z-10">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[13px] font-black text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                    >
                      취소
                    </button>
                    <button
                      onClick={addSchedule}
                      disabled={!newTitle.trim() || !selectedDay}
                      className="flex-1 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[13px] font-black hover:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-xl shadow-slate-900/10 dark:shadow-blue-900/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                    >
                      일정 저장
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {editing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => (editSaving ? null : setEditing(null))}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-8 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">일정 수정</h3>
                <button
                  onClick={() => (editSaving ? null : setEditing(null))}
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">제목</label>
                  <input
                    value={editForm.custom_title}
                    onChange={(e) => setEditForm((p) => ({ ...p, custom_title: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">상태</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white"
                  >
                    {statusKeys.map((k) => (
                      <option key={k} value={k}>
                        {STATUS_CONFIG[k].label}
                      </option>
                    ))}
                    {!Object.prototype.hasOwnProperty.call(STATUS_CONFIG, editForm.status) ? (
                      <option value={editForm.status}>{editForm.status}</option>
                    ) : null}
                  </select>
                </div>

                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={editForm.alarm_enabled}
                      onChange={(e) => setEditForm((p) => ({ ...p, alarm_enabled: e.target.checked }))}
                    />
                    알림 사용
                  </label>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">방문일</label>
                  <input
                    type="date"
                    value={editForm.visit_date}
                    onChange={(e) => setEditForm((p) => ({ ...p, visit_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">마감일</label>
                  <input
                    type="date"
                    value={editForm.deadline_date}
                    onChange={(e) => setEditForm((p) => ({ ...p, deadline_date: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">스폰서십</label>
                  <input
                    value={editForm.sponsorship_value}
                    onChange={(e) => setEditForm((p) => ({ ...p, sponsorship_value: e.target.value.replace(/[^\d]/g, "") }))}
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">광고비</label>
                  <input
                    value={editForm.ad_fee}
                    onChange={(e) => setEditForm((p) => ({ ...p, ad_fee: e.target.value.replace(/[^\d]/g, "") }))}
                    inputMode="numeric"
                    placeholder="0"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">메모</label>
                  <textarea
                    value={editForm.memo}
                    onChange={(e) => setEditForm((p) => ({ ...p, memo: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditing(null)}
                  disabled={editSaving}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  onClick={saveEdit}
                  disabled={editSaving}
                  className="flex-1 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                >
                  {editSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
