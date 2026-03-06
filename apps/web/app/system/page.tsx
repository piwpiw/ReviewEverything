"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, RefreshCcw, Server, ShieldAlert, Wrench } from "lucide-react";

type HealthStatus = "ok" | "error" | "checking";

type QualityPayload = {
  status: "ok" | "warn" | "critical";
  measured_at: string;
  window_hours: number;
  alerts_count: number;
  suppressed_count?: number;
  metrics: {
    ingest: { total: number; success: number; failed: number; successRate: number };
    jobs: { total: number; completed: number; failed: number; pending: number; running: number; completionRate: number };
    notifications: { total: number; sent: number; failed: number; successRate: number };
    dataFreshness: { lastCampaignUpdateAt: string | null; ageMinutes: number | null };
  };
  thresholds?: {
    freshnessMaxMinutes?: number;
  };
};

type AlertPayload = {
  status: "ok" | "warn" | "critical";
  measured_at: string;
  summary: { total: number; critical: number; warn: number };
  data: Array<{
    id: string;
    level: "info" | "warn" | "critical";
    source: string;
    title: string;
    detail: string;
    actionPath?: string;
  }>;
};

type FetchState = {
  status: "loading" | "loaded" | "error";
  error: string | null;
};

const statusBadge = (status: string) => {
  if (status === "ok") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  if (status === "warn") return "bg-amber-500/15 text-amber-300 border-amber-500/40";
  return "bg-rose-500/15 text-rose-300 border-rose-500/40";
};

const statusText = (status: string) => {
  if (status === "ok") return "정상";
  if (status === "warn") return "주의";
  if (status === "critical") return "심각";
  if (status === "error") return "오류";
  if (status === "checking") return "점검중";
  return status;
};

const levelBadge = (level: string) => {
  if (level === "critical") return "bg-rose-500/15 text-rose-300 border-rose-500/40";
  if (level === "warn") return "bg-amber-500/15 text-amber-300 border-amber-500/40";
  return "bg-blue-500/15 text-blue-300 border-blue-500/40";
};

const levelText = (level: string) => {
  if (level === "critical") return "심각";
  if (level === "warn") return "주의";
  if (level === "info") return "안내";
  return level;
};

export default function SystemPage() {
  const [quality, setQuality] = useState<QualityPayload | null>(null);
  const [alerts, setAlerts] = useState<AlertPayload | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading", error: null });
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});

  const fetchAll = async () => {
    setFetchState({ status: "loading", error: null });
    try {
      const [qualityRes, alertsRes, healthRes] = await Promise.all([
        fetch("/api/admin/quality"),
        fetch("/api/admin/alerts"),
        fetch("/api/health"),
      ]);

      if (qualityRes.ok) {
        const qualityData = (await qualityRes.json()) as QualityPayload;
        setQuality(qualityData);
      }

      if (alertsRes.ok) {
        const alertsData = (await alertsRes.json()) as AlertPayload;
        setAlerts(alertsData);
      }

      if (healthRes.ok) {
        const healthData = (await healthRes.json()) as { db?: string };
        setHealthStatus(healthData.db === "ok" ? "ok" : "error");
      } else {
        setHealthStatus("error");
      }

      setFetchState({ status: "loaded", error: null });
    } catch {
      setHealthStatus("error");
      setFetchState({ status: "error", error: "시스템 상태 점검 또는 알림 조회에 실패했습니다." });
    }
  };

  useEffect(() => {
    void fetchAll();
    const timer = setInterval(fetchAll, 30000);
    return () => clearInterval(timer);
  }, []);

  const runAlertAction = async (id: string) => {
    setActioningId(id);
    setActionErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    try {
      const res = await fetch("/api/admin/alerts/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "ack", minutes: 120 }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || "알림 조치 요청이 실패했습니다.");
      }
      await fetchAll();
    } catch {
      setActionErrors((prev) => ({ ...prev, [id]: "알림 조치 요청이 실패했습니다. 재시도 가능합니다." }));
    } finally {
      setActioningId(null);
    }
  };

  const score = useMemo(() => {
    if (!quality) return null;
    const ingest = quality.metrics.ingest.successRate;
    const notifications = quality.metrics.notifications.successRate;
    const jobs = quality.metrics.jobs.completionRate;
    return Math.round((ingest + notifications + jobs) / 3);
  }, [quality]);

  return (
    <main className="min-h-screen bg-[#020617] dark:bg-[#020617] text-slate-200 pb-16">
      <section className="max-w-[1700px] mx-auto px-4 md:px-8 pt-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-black">운영 인프라</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">시스템 점검 센터</h1>
            <p className="text-sm text-slate-400 mt-2">실시간 상태, 수집 품질, 알림을 한 화면에서 점검하고 조치할 수 있습니다.</p>
            <p className="text-xs text-slate-500 mt-1">연동 실패 시 fallback 상태 로그를 기반으로 복구 경로를 안내합니다.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Link
              href="/admin"
              aria-label="운영 콘솔로 이동"
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold hover:bg-slate-700 transition-colors whitespace-nowrap focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              운영 콘솔
            </Link>
            <Link
              href="/me"
              aria-label="사용자 홈으로 이동"
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              사용자 홈
            </Link>
            <button
              onClick={() => void fetchAll()}
              disabled={fetchState.status === "loading"}
              aria-label="시스템 상태 다시 점검"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors text-sm font-bold inline-flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <RefreshCcw className={`w-4 h-4 ${fetchState.status === "loading" ? "animate-spin" : ""}`} />
              다시 점검
            </button>
          </div>
        </div>

        {fetchState.status === "error" && fetchState.error ? (
          <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 text-rose-200 px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>{fetchState.error}</span>
            <button
              onClick={() => void fetchAll()}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-400/40 text-rose-200 hover:bg-rose-400/10 text-xs font-bold focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2"
            >
              재시도
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">데이터베이스 상태</span>
              <Server className="w-4 h-4 text-blue-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{statusText(healthStatus)}</p>
            <span className={`inline-flex mt-2 text-xs px-2 py-1 rounded-full border ${statusBadge(healthStatus === "checking" ? "warn" : healthStatus === "ok" ? "ok" : "critical")}`}>
              DB: {statusText(healthStatus)}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">품질 상태</span>
              <ShieldAlert className="w-4 h-4 text-indigo-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{statusText(quality?.status ?? "warn")}</p>
            <span className={`inline-flex mt-2 text-xs px-2 py-1 rounded-full border ${statusBadge(quality?.status ?? "warn")}`}>
              알림 {quality?.alerts_count ?? 0}건
            </span>
            <p className="text-xs text-slate-500 mt-2">제외 {quality?.suppressed_count ?? 0}건</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">운영 점수</span>
              <Activity className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{score ?? "-"}</p>
            <p className="text-xs text-slate-400 mt-2">수집 + 작업 + 알림 성공률 기반</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">심각 알림</span>
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{alerts?.summary?.critical ?? 0}</p>
            <p className="text-xs text-slate-400 mt-2">주의: {alerts?.summary?.warn ?? 0}건</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-black text-white mb-4">24시간 운영 지표</h2>
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">수집 성공률</p>
                <p className="text-xl font-black text-white">{quality?.metrics.ingest.successRate ?? 0}%</p>
                <p className="text-xs text-slate-500">성공 {quality?.metrics.ingest.success ?? 0} / 전체 {quality?.metrics.ingest.total ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">배치 작업 완료율</p>
                <p className="text-xl font-black text-white">{quality?.metrics.jobs.completionRate ?? 0}%</p>
                <p className="text-xs text-slate-500">진행중 {quality?.metrics.jobs.running ?? 0} / 실패 {quality?.metrics.jobs.failed ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">알림 전송 성공률</p>
                <p className="text-xl font-black text-white">{quality?.metrics.notifications.successRate ?? 0}%</p>
                <p className="text-xs text-slate-500">전송 {quality?.metrics.notifications.sent ?? 0} / 실패 {quality?.metrics.notifications.failed ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">데이터 최신성</p>
                <p className={`text-xl font-black ${quality?.metrics.dataFreshness.ageMinutes !== null &&
                    quality?.thresholds?.freshnessMaxMinutes !== undefined &&
                    (quality.metrics.dataFreshness.ageMinutes ?? 0) > quality.thresholds.freshnessMaxMinutes
                    ? "text-rose-400"
                    : "text-white"
                  }`}>
                  {quality?.metrics.dataFreshness.ageMinutes !== null && quality?.metrics.dataFreshness.ageMinutes !== undefined
                    ? `${quality.metrics.dataFreshness.ageMinutes}분`
                    : "미확인"}
                </p>
                <p className="text-xs text-slate-500">목표 {quality?.thresholds?.freshnessMaxMinutes ?? 180}분 이내</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-black text-white mb-4">운영 알림</h2>
            <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
              {(alerts?.data ?? []).length === 0 ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-200">처리할 알림이 없습니다</p>
                    <p className="text-xs text-emerald-100/80">현재 운영 상태가 정상 범위 내입니다.</p>
                  </div>
                </div>
              ) : (
                alerts?.data?.map((alert) => (
                  <article key={alert.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-white">{alert.title}</p>
                      <span className={`text-[11px] px-2 py-1 rounded-full border ${levelBadge(alert.level)}`}>{levelText(alert.level)}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{alert.detail}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[11px] text-slate-500">원인: {alert.source}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void runAlertAction(alert.id)}
                          disabled={actioningId === alert.id}
                          aria-label={`${alert.title} 상태 처리`}
                          className="text-[11px] px-2 py-1 rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                        >
                          상태 처리
                        </button>
                        {alert.actionPath ? (
                          <Link
                            href={alert.actionPath}
                            aria-label={`${alert.title} 조치 화면으로 이동`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-blue-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            이동
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    {actionErrors[alert.id] ? (
                      <div className="mt-2 text-[11px] text-rose-300 flex items-center justify-between">
                        <span>{actionErrors[alert.id]}</span>
                        <button
                          onClick={() => void runAlertAction(alert.id)}
                          className="px-2 py-1 rounded-md border border-rose-500/40 text-rose-200 hover:bg-rose-500/10 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                        >
                          재시도
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

