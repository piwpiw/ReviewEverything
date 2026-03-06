"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bell, CheckCircle2, Clock, ShieldAlert, Trash2 } from "lucide-react";

type NotificationDelivery = {
  id: number;
  status: string;
  sent_at: string | null;
  created_at?: string;
  error_message: string | null;
  message?: string | null;
  channel?: string | null;
  attempted_channels?: string | null;
  userSchedule?: {
    custom_title: string | null;
  } | null;
};
type NotificationFilter = "all" | "success" | "pending" | "failed";
type ChannelFilter = "all" | "push" | "kakao" | "telegram";
type TimeRangeFilter = "all" | "7d" | "30d" | "90d";
type AttemptedChannelEntry = { channel?: string; detail?: string; ok?: boolean };

const isSuccess = (status: string) => status === "SUCCESS" || status === "SENT";
const isPending = (status: string) => status === "PENDING";
const isFailed = (status: string) => !isSuccess(status) && !isPending(status);

const statusLabel = (status: string) => {
  if (isSuccess(status)) return "완료";
  if (isPending(status)) return "대기";
  if (isFailed(status)) return "실패";
  return status;
};

function NotificationsContent() {
  const sp = useSearchParams();
  const userId = Number.parseInt(sp.get("userId") || "1", 10);

  const [notifications, setNotifications] = useState<NotificationDelivery[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>("all");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const buildFilters = () => {
    const params = new URLSearchParams();
    params.set("userId", String(userId));
    if (filter !== "all") params.set("status", filter);
    if (channelFilter !== "all") params.set("channel", channelFilter);
    if (timeRange !== "all") {
      const offset = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const from = new Date();
      from.setDate(from.getDate() - offset);
      params.set("from", from.toISOString());
    }
    return params;
  };

  const load = async () => {
    setNotifications([]);
    setLoading(true);
    setError(null);
    setHasMore(false);
    setNextCursor(null);

    try {
      const res = await fetch(`/api/me/notifications?${buildFilters().toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `요청 실패 (${res.status})`);
      }
      const payload = (await res.json()) as { data?: NotificationDelivery[]; meta?: { hasMore?: boolean; nextCursor?: number | null } };
      const list = Array.isArray(payload?.data) ? payload.data : [];
      setNotifications(list);
      setHasMore(Boolean(payload?.meta?.hasMore));
      setNextCursor(typeof payload?.meta?.nextCursor === "number" ? payload.meta.nextCursor : null);
      setLoadMoreError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "알림 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || !nextCursor || loading || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const params = buildFilters();
      params.set("take", "20");
      params.set("cursor", String(nextCursor));
      const res = await fetch(`/api/me/notifications?${params.toString()}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `요청 실패 (${res.status})`);
      }
      const payload = (await res.json()) as { data?: NotificationDelivery[]; meta?: { hasMore?: boolean; nextCursor?: number | null } };
      const list = Array.isArray(payload?.data) ? payload.data : [];
      setNotifications((prev) => [...prev, ...list]);
      setHasMore(Boolean(payload?.meta?.hasMore));
      setNextCursor(typeof payload?.meta?.nextCursor === "number" ? payload.meta.nextCursor : null);
    } catch (e: unknown) {
      setLoadMoreError(e instanceof Error ? e.message : "추가 데이터를 불러오지 못했습니다.");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!Number.isInteger(userId)) {
      setError("유효하지 않은 사용자 ID입니다.");
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filter, channelFilter, timeRange]);

  const deleteNotification = async (id: number) => {
    if (deletingId !== null) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/me/notifications/${id}?userId=${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || `요청 실패 (${res.status})`);
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "알림 삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const headerBadge = useMemo(() => {
    const success = notifications.filter((n) => isSuccess(n.status)).length;
    const pending = notifications.filter((n) => isPending(n.status)).length;
    const failed = notifications.length - success - pending;
    return { success, failed };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "success") {
      return notifications.filter((n) => isSuccess(n.status));
    }
    if (filter === "pending") {
      return notifications.filter((n) => isPending(n.status));
    }
    if (filter === "failed") {
      return notifications.filter((n) => isFailed(n.status));
    }
    return notifications;
  }, [filter, notifications]);

  const getAttemptedChannels = (delivery: NotificationDelivery): AttemptedChannelEntry[] => {
    if (!delivery.attempted_channels) return [];
    try {
      const raw = JSON.parse(delivery.attempted_channels);
      if (Array.isArray(raw)) return raw as AttemptedChannelEntry[];
    } catch {
      return [];
    }
    return [];
  };

  const getAttemptSummary = (delivery: NotificationDelivery) => {
    const attempts = getAttemptedChannels(delivery);
    if (attempts.length === 0) return "시도 내역이 없습니다.";

    return attempts
      .map((entry) => `${entry.channel || "알 수 없음"}:${isAttemptSuccess(entry) ? "성공" : "실패"}`)
      .join(" → ");
  };

  const isAttemptSuccess = (entry: AttemptedChannelEntry) => {
    if (typeof entry.ok === "boolean") {
      return entry.ok;
    }
    const detail = String(entry.detail || "").toLowerCase();
    return detail === "ok" || detail === "success" || detail.includes(":ok") || detail.endsWith(" ok");
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-[820px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/me"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-blue-600 transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" /> 알림
              </h1>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">발송 이력</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-black">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              완료 {headerBadge.success}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-300">
              실패 {headerBadge.failed}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300">
              대기 {notifications.filter((n) => isPending(n.status)).length}
            </span>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-bold flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              onClick={() => void load()}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-100 text-xs font-bold focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              재시도
            </button>
          </div>
        ) : null}
        <section className="space-y-4">
          <h2 className="sr-only">알림 필터와 목록</h2>
          <div className="flex items-center gap-2 text-xs">
            {(
              [
                ["all", "전체", notifications.length],
                ["success", "완료", headerBadge.success],
                ["pending", "대기", notifications.filter((n) => isPending(n.status)).length],
                ["failed", "실패", headerBadge.failed],
              ] as const
            ).map(([value, label, count]) => {
              const isActive = filter === value;
              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-3 py-1.5 rounded-xl border ${isActive
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                >
                  {label} {count}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {(
              [
                ["all", "전체"],
                ["push", "푸시"],
                ["kakao", "카카오"],
                ["telegram", "텔레그램"],
              ] as const
            ).map(([value, label]) => {
              const value2 = value as ChannelFilter;
              const isActive = channelFilter === value2;
              return (
                <button
                  key={value2}
                  onClick={() => setChannelFilter(value2)}
                  className={`px-3 py-1.5 rounded-xl border ${isActive
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {(
              [
                ["all", "전체"],
                ["7d", "7d"],
                ["30d", "30d"],
                ["90d", "90d"],
              ] as const
            ).map(([value, label]) => {
              const value2 = value as TimeRangeFilter;
              const isActive = timeRange === value2;
              return (
                <button
                  key={value2}
                  onClick={() => setTimeRange(value2)}
                  className={`px-3 py-1.5 rounded-xl border ${isActive
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-white dark:bg-slate-900/50 rounded-3xl animate-pulse border border-slate-100 dark:border-slate-800" />
            ))
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-slate-200 dark:text-slate-700" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">아직 발송 내역이 없습니다</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">
                리마인더 발송이 시작되면 이곳에 이력이 표시됩니다.
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((n, i) => {
                const attempts = getAttemptedChannels(n);
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between gap-4 relative z-10">
                      <div className="flex gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isSuccess(n.status)
                              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                              : isPending(n.status)
                                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600"
                                : "bg-rose-50 dark:bg-rose-900/20 text-rose-600"
                            }`}
                        >
                          {isSuccess(n.status) ? <CheckCircle2 className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                              {n.userSchedule?.custom_title || "일정 리마인더"}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <span className="text-[10px] font-black text-slate-400">{statusLabel(n.status)}</span>
                          </div>
                          <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">
                            {isSuccess(n.status)
                              ? "알림이 성공적으로 발송되었습니다."
                              : isPending(n.status)
                                ? "발송 대기 중입니다."
                                : `실패: ${n.error_message || "알 수 없는 오류"}`}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">채널: {n.channel || "알 수 없음"}</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            시도 경로: <span className="font-bold">{getAttemptSummary(n)}</span>
                          </p>
                          {attempts.length > 0 ? (
                            <div className="mt-1">
                              <p className="text-[10px] text-slate-500 font-bold">시도 상세:</p>
                              <ul className="mt-0.5 text-[11px] text-slate-500 space-y-0.5">
                                {attempts.map((entry, idx) => (
                                  <li key={`${n.id}-${idx}`} className="font-bold flex items-center gap-2">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${isAttemptSuccess(entry)
                                          ? "bg-emerald-50 text-emerald-600"
                                          : "bg-rose-50 text-rose-600"
                                        }`}
                                    >
                                      {isAttemptSuccess(entry) ? "성공" : "실패"}
                                    </span>
                                    {entry.channel || "알 수 없음"}: {entry.detail || "상세 정보 없음"}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {n.message ? <p className="text-xs text-slate-500 mt-2">{n.message}</p> : null}
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-400">
                            <Clock className="w-3 h-3" />
                            {new Date(n.sent_at || n.created_at || Date.now()).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteNotification(n.id)}
                        disabled={deletingId === n.id}
                        className={`p-2 text-slate-300 hover:text-rose-500 transition-all ${deletingId === n.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                        aria-label="알림 삭제"
                      >
                        <Trash2 className={`w-4 h-4 ${deletingId === n.id ? "animate-spin" : ""}`} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}

          {loadMoreError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm font-bold flex items-center justify-between gap-4">
              <span>{loadMoreError}</span>
              <button
                onClick={() => void loadMore()}
                className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-100 text-xs font-bold focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                재시도
              </button>
            </div>
          ) : null}
        </section>

        {!loading && hasMore ? (
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {loadingMore ? "불러오는 중..." : "더 보기"}
            </button>
          </div>
        ) : null}

        <div className="mt-10 flex justify-end">
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            새로고침
          </button>
        </div>
      </div>
    </main>
  );
}

import { Suspense } from "react";

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="p-8">불러오는 중...</div>}>
      <NotificationsContent />
    </Suspense>
  );
}
