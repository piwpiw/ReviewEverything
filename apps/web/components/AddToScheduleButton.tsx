"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, CheckCircle2, X } from "lucide-react";

type Props = {
  userId: number;
  campaignId: number;
  defaultTitle: string;
  deadlineDateIso: string | null;
};

const toUtcMidnightIso = (dateKey: string) => {
  const [y, m, d] = dateKey.split("-").map((x) => Number.parseInt(x, 10));
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString();
};

type DateTarget = "visit" | "deadline";

export default function AddToScheduleButton({ userId, campaignId, defaultTitle, deadlineDateIso }: Props) {
  const fallbackDeadlineDate = deadlineDateIso ? deadlineDateIso.slice(0, 10) : "";
  const defaultDateTarget: DateTarget = fallbackDeadlineDate ? "deadline" : "visit";
  const getDefaultSelectedDate = () => (defaultDateTarget === "deadline" ? fallbackDeadlineDate : "");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [createdScheduleId, setCreatedScheduleId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: defaultTitle,
    status: "APPLIED",
    dateTarget: defaultDateTarget,
    selectedDate: getDefaultSelectedDate(),
    deadlineDate: fallbackDeadlineDate,
    memo: "",
    alarm_enabled: true,
  });

  const effectiveDeadlineDate = form.deadlineDate || (deadlineDateIso ? deadlineDateIso.slice(0, 10) : "");
  const deadlineLabel = useMemo(() => (effectiveDeadlineDate || "-"), [effectiveDeadlineDate]);
  const resolvedSelectedDate = form.selectedDate || "";
  const selectedDeadlineDateIso = effectiveDeadlineDate ? toUtcMidnightIso(effectiveDeadlineDate) : null;
  const canSubmit = useMemo(() => {
    const hasTitle = form.title.trim().length > 0;
    const hasRequiredDate = form.dateTarget === "visit" ? !!resolvedSelectedDate : !!(resolvedSelectedDate || effectiveDeadlineDate);
    return hasTitle && hasRequiredDate;
  }, [form.dateTarget, form.title, resolvedSelectedDate, effectiveDeadlineDate]);
  const dateValidationMessage = useMemo(() => {
    if (form.dateTarget === "visit" && !resolvedSelectedDate) return "방문일을 선택해 주세요.";
    if (form.dateTarget === "deadline" && !resolvedSelectedDate && !effectiveDeadlineDate) return "마감일을 선택해 주세요.";
    return null;
  }, [effectiveDeadlineDate, form.dateTarget, resolvedSelectedDate]);

  const submit = async () => {
    if (!Number.isInteger(userId)) {
      setError("유효하지 않은 사용자 ID입니다.");
      return;
    }
    if (form.dateTarget === "visit" && !resolvedSelectedDate) {
      setError("방문일을 선택해 주세요.");
      setSaving(false);
      return;
    }
    if (form.dateTarget === "deadline" && !resolvedSelectedDate && !effectiveDeadlineDate) {
      setError("마감일을 선택해 주세요.");
      setSaving(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const selectedDateIso = resolvedSelectedDate ? toUtcMidnightIso(resolvedSelectedDate) : null;
      const visitDate = form.dateTarget === "visit" ? selectedDateIso : null;
      const deadlineDate = form.dateTarget === "deadline" ? selectedDateIso : selectedDeadlineDateIso;
      const response = await fetch("/api/me/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          campaign_id: campaignId,
          custom_title: form.title.trim() || defaultTitle,
          status: form.status,
          visit_date: visitDate,
          deadline_date: deadlineDate,
          memo: form.memo.trim() || null,
          alarm_enabled: Boolean(form.alarm_enabled),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; id?: number | string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "캘린더 추가 실패");
      }
      const rawId = payload?.id;
      const nextId = typeof rawId === "string" ? Number.parseInt(rawId, 10) : Number.isInteger(rawId) ? (rawId as number) : null;
      setCreatedScheduleId(nextId ?? null);
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "캘린더 추가 실패");
    } finally {
      setSaving(false);
    }
  };

  const focusDate = (() => {
    if (form.dateTarget === "visit" && form.selectedDate) return form.selectedDate;
    if (form.dateTarget === "deadline" && form.selectedDate) return form.selectedDate;
    if (effectiveDeadlineDate) return effectiveDeadlineDate;
    return null;
  })();

  const calendarHref = useMemo(() => {
    const params = new URLSearchParams({ userId: String(userId) });
    if (focusDate) params.set("focusDate", focusDate);
    if (createdScheduleId) params.set("highlightScheduleId", String(createdScheduleId));
    return `/me/calendar?${params.toString()}`;
  }, [createdScheduleId, focusDate, userId]);

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setDone(false);
          setCreatedScheduleId(null);
          setError(null);
          const nextDateTarget = fallbackDeadlineDate ? "deadline" : "visit";
          const nextSelectedDate = nextDateTarget === "deadline" ? fallbackDeadlineDate : "";
          setForm((p) => ({
            ...p,
            title: defaultTitle,
            dateTarget: nextDateTarget,
            selectedDate: nextSelectedDate,
            deadlineDate: fallbackDeadlineDate,
          }));
        }}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-[2rem] bg-white border border-slate-200 text-slate-900 font-black hover:border-blue-500 hover:text-blue-600 transition-colors"
      >
        <CalendarPlus className="w-5 h-5" />
        일정 추가
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => (saving ? null : setOpen(false))}
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl p-8 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">일정 등록</h3>
                <button
                  onClick={() => (saving ? null : setOpen(false))}
                  className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-bold">
                  {error}
                </div>
              ) : null}

              {done ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
                  <div className="flex items-center gap-2 font-black">
                    <CheckCircle2 className="w-5 h-5" />
                    캘린더에 일정이 추가되었습니다.
                  </div>
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={calendarHref}
                      className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-black text-center hover:bg-blue-600 transition-colors"
                    >
                      캘린더 보기
                    </Link>
                    <button
                      onClick={() => setOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-black hover:bg-slate-50 transition-colors"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 block mb-2">캠페인명</label>
                      <input
                        value={form.title}
                        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">상태</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                      >
                        <option value="APPLIED">지원</option>
                        <option value="SELECTED">선정</option>
                        <option value="SCHEDULED">예정</option>
                        <option value="REVIEWING">리뷰중</option>
                        <option value="COMPLETED">완료</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 block mb-2">날짜 유형</label>
                      <select
                        value={form.dateTarget}
                        onChange={(e) =>
                          setForm((p) => {
                            const nextDateTarget = e.target.value as DateTarget;
                            const nextSelectedDate =
                              nextDateTarget === "deadline" && !p.selectedDate && effectiveDeadlineDate ? effectiveDeadlineDate : p.selectedDate;
                            return { ...p, dateTarget: nextDateTarget, selectedDate: nextSelectedDate };
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                      >
                        <option value="visit">방문일</option>
                        <option value="deadline">마감일</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 block mb-2 uppercase">
                        {form.dateTarget === "visit" ? "방문일 : " : "마감일 : "}
                      </label>
                      <input
                        type="date"
                        value={form.selectedDate}
                        onChange={(e) => setForm((p) => ({ ...p, selectedDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 block mb-2">기본 마감일 (직접 설정 가능)</label>
                      <input
                        type="date"
                        value={form.deadlineDate}
                        onChange={(e) => setForm((p) => ({ ...p, deadlineDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                        현재 마감일: <span className="font-black">{deadlineLabel}</span>
                      </div>
                    </div>

                    {(!canSubmit && dateValidationMessage) ? (
                      <div className="md:col-span-2">
                        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 text-[11px] font-bold">
                          {dateValidationMessage}
                        </div>
                      </div>
                    ) : null}

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 block mb-2">메모</label>
                      <textarea
                        value={form.memo}
                        onChange={(e) => setForm((p) => ({ ...p, memo: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={form.alarm_enabled}
                          onChange={(e) => setForm((p) => ({ ...p, alarm_enabled: e.target.checked }))}
                        />
                        알림 사용
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setOpen(false)}
                      disabled={saving}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={submit}
                      disabled={saving || !canSubmit}
                      className="flex-1 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10 active:scale-95 disabled:opacity-50"
                    >
                      {saving ? "추가 중..." : "일정 추가"}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
