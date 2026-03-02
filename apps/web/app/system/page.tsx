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
  thresholds: {
    ingestSuccessMin: number;
    notificationSuccessMin: number;
    freshnessMaxMinutes: number;
    staleRunningJobMaxMinutes: number;
  };
};

type AlertPayload = {
  status: "ok" | "warn" | "critical";
  measured_at: string;
  summary: { total: number; critical: number; warn: number };
  suppressed?: Array<{ id: string; action: "ack" | "snooze"; until: string }>;
  data: AlertItem[];
};

type AlertItem = {
  id: string;
  level: "info" | "warn" | "critical";
  source: string;
  title: string;
  detail: string;
  actionPath?: string;
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

const levelBadge = (level: string) => {
  if (level === "critical") return "bg-rose-500/15 text-rose-300 border-rose-500/40";
  if (level === "warn") return "bg-amber-500/15 text-amber-300 border-amber-500/40";
  return "bg-blue-500/15 text-blue-300 border-blue-500/40";
};

export default function SystemPage() {
  const [quality, setQuality] = useState<QualityPayload | null>(null);
  const [alerts, setAlerts] = useState<AlertPayload | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading", error: null });
  const [actioningId, setActioningId] = useState<string | null>(null);

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
      setFetchState({ status: "error", error: "시스템 상태 정보를 불러오지 못했습니다." });
    }
  };

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 30000);
    return () => clearInterval(timer);
  }, []);

  const runAlertAction = async (id: string) => {
    setActioningId(id);
    try {
      const res = await fetch("/api/admin/alerts/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "ack", minutes: 120 }),
      });
      if (!res.ok) throw new Error("알림 조치 처리에 실패했습니다.");
      await fetchAll();
    } catch {
      setFetchState({ ...fetchState, status: "error", error: "알림 조치가 실패했습니다." });
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
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-16">
      <section className="max-w-[1300px] mx-auto px-4 md:px-8 pt-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-black">시스템 운영</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">운영 제어 센터</h1>
            <p className="text-sm text-slate-400 mt-2">서비스 상태, 알림 큐, 복구 흐름을 한 번에 확인합니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold hover:bg-slate-700 transition-colors">
              관리자 콘솔
            </Link>
            <button
              onClick={fetchAll}
              disabled={fetchState.status === "loading"}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors text-sm font-bold inline-flex items-center gap-2"
            >
              <RefreshCcw className={`w-4 h-4 ${fetchState.status === "loading" ? "animate-spin" : ""}`} />
              새로고침
            </button>
          </div>
        </div>

        {fetchState.status === "error" && fetchState.error ? (
          <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 text-rose-200 px-4 py-2 text-sm">{fetchState.error}</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">서비스 상태</span>
              <Server className="w-4 h-4 text-blue-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{healthStatus.toUpperCase()}</p>
            <span className={`inline-flex mt-2 text-xs px-2 py-1 rounded-full border ${statusBadge(healthStatus === "checking" ? "warn" : healthStatus === "ok" ? "ok" : "critical")}`}>
              db {healthStatus}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">품질 상태</span>
              <ShieldAlert className="w-4 h-4 text-indigo-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{quality?.status?.toUpperCase() ?? "CHECK"}</p>
            <span className={`inline-flex mt-2 text-xs px-2 py-1 rounded-full border ${statusBadge(quality?.status ?? "warn")}`}>
              alerts {quality?.alerts_count ?? 0}
            </span>
            <p className="text-xs text-slate-500 mt-2">suppressed {quality?.suppressed_count ?? 0}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">운영 점수</span>
              <Activity className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{score ?? "-"}</p>
            <p className="text-xs text-slate-400 mt-2">ingest + jobs + notification</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">심각 알림</span>
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{alerts?.summary?.critical ?? 0}</p>
            <p className="text-xs text-slate-400 mt-2">warn: {alerts?.summary?.warn ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-black text-white mb-4">품질 지표 (24시간)</h2>
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">수집 성공률</p>
                <p className="text-xl font-black text-white">{quality?.metrics.ingest.successRate ?? 0}%</p>
                <p className="text-xs text-slate-500">성공 {quality?.metrics.ingest.success ?? 0} / 전체 {quality?.metrics.ingest.total ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">백그라운드 작업 완료</p>
                <p className="text-xl font-black text-white">{quality?.metrics.jobs.completionRate ?? 0}%</p>
                <p className="text-xs text-slate-500">실행중 {quality?.metrics.jobs.running ?? 0} / 실패 {quality?.metrics.jobs.failed ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">알림 전송 성공</p>
                <p className="text-xl font-black text-white">{quality?.metrics.notifications.successRate ?? 0}%</p>
                <p className="text-xs text-slate-500">전송 {quality?.metrics.notifications.sent ?? 0} / 실패 {quality?.metrics.notifications.failed ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">데이터 최신성</p>
                <p className="text-xl font-black text-white">
                  {quality?.metrics.dataFreshness.ageMinutes !== null && quality?.metrics.dataFreshness.ageMinutes !== undefined
                    ? `${quality.metrics.dataFreshness.ageMinutes}m`
                    : "n/a"}
                </p>
                <p className="text-xs text-slate-500">목표 &lt;= {quality?.thresholds.freshnessMaxMinutes ?? 180}분</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-black text-white mb-4">활성 알림</h2>
            <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
              {(alerts?.data ?? []).length === 0 ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-200">활성 알림이 없습니다</p>
                    <p className="text-xs text-emerald-100/80">시스템 상태가 정상 범위입니다.</p>
                  </div>
                </div>
              ) : (
                alerts?.data?.map((alert) => (
                  <article key={alert.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-white">{alert.title}</p>
                      <span className={`text-[11px] px-2 py-1 rounded-full border ${levelBadge(alert.level)}`}>{alert.level}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{alert.detail}</p>
                    <div className="mt-3 flex items-center justify-between">
                  <p className="text-[11px] text-slate-500">출처: {alert.source}</p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => runAlertAction(alert.id)}
                          disabled={actioningId === alert.id}
                          className="text-[11px] px-2 py-1 rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
                        >
                          2시간 후 조치
                        </button>
                        {alert.actionPath ? (
                          <Link href={alert.actionPath} className="inline-flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-blue-200">
                            <Wrench className="w-3.5 h-3.5" />
                            조치 이동
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-600">해당 없음</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
