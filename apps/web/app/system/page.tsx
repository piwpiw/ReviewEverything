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

type AlertItem = {
  id: string;
  level: "info" | "warn" | "critical";
  source: string;
  title: string;
  detail: string;
  actionPath?: string;
  createdAt: string;
};

type AlertsPayload = {
  status: "ok" | "warn" | "critical";
  measured_at: string;
  summary: { total: number; critical: number; warn: number };
  suppressed?: Array<{ id: string; action: "ack" | "snooze"; until: string }>;
  data: AlertItem[];
};

function statusBadge(status: string) {
  if (status === "ok") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  if (status === "warn") return "bg-amber-500/15 text-amber-300 border-amber-500/40";
  return "bg-rose-500/15 text-rose-300 border-rose-500/40";
}

function levelBadge(level: string) {
  if (level === "critical") return "bg-rose-500/15 text-rose-300 border-rose-500/40";
  if (level === "warn") return "bg-amber-500/15 text-amber-300 border-amber-500/40";
  return "bg-blue-500/15 text-blue-300 border-blue-500/40";
}

export default function SystemPage() {
  const [quality, setQuality] = useState<QualityPayload | null>(null);
  const [alerts, setAlerts] = useState<AlertsPayload | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [refreshing, setRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const load = async () => {
    setRefreshing(true);
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
        const alertsData = (await alertsRes.json()) as AlertsPayload;
        setAlerts(alertsData);
      }

      if (healthRes.ok) {
        const healthData = (await healthRes.json()) as { db?: string };
        setHealthStatus(healthData.db === "ok" ? "ok" : "error");
      } else {
        setHealthStatus("error");
      }
    } catch {
      setHealthStatus("error");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, []);

  const runAlertAction = async (id: string, action: "ack" | "snooze") => {
    setActioningId(id);
    try {
      const res = await fetch("/api/admin/alerts/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action,
          minutes: action === "ack" ? 120 : 24 * 60,
        }),
      });
      if (!res.ok) throw new Error("failed to apply alert action");
      await load();
    } catch {
      // Keep UX simple for operations mode; refreshed state is enough feedback.
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
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-black">System Operations</p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">Release Command Center</h1>
            <p className="text-sm text-slate-400 mt-2">운영 품질, 경보, 복구 경로를 한 화면에서 관리합니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold hover:bg-slate-700 transition-colors">
              Admin Console
            </Link>
            <button
              onClick={load}
              disabled={refreshing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors text-sm font-bold inline-flex items-center gap-2"
            >
              <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">Service Health</span>
              <Server className="w-4 h-4 text-blue-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{healthStatus.toUpperCase()}</p>
            <span className={`inline-flex mt-2 text-xs px-2 py-1 rounded-full border ${statusBadge(healthStatus === "checking" ? "warn" : healthStatus === "ok" ? "ok" : "critical")}`}>
              db {healthStatus}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">Quality Status</span>
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
              <span className="text-xs text-slate-400 font-bold">Operational Score</span>
              <Activity className="w-4 h-4 text-emerald-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{score ?? "-"}</p>
            <p className="text-xs text-slate-400 mt-2">ingest + jobs + notification</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold">Critical Alerts</span>
              <AlertTriangle className="w-4 h-4 text-rose-300" />
            </div>
            <p className="mt-3 text-2xl font-black text-white">{alerts?.summary?.critical ?? 0}</p>
            <p className="text-xs text-slate-400 mt-2">warn: {alerts?.summary?.warn ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-black text-white mb-4">Quality Metrics (24h)</h2>
            <div className="space-y-4 text-sm">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">Ingestion Success</p>
                <p className="text-xl font-black text-white">{quality?.metrics.ingest.successRate ?? 0}%</p>
                <p className="text-xs text-slate-500">{quality?.metrics.ingest.success ?? 0}/{quality?.metrics.ingest.total ?? 0} runs</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">Background Job Completion</p>
                <p className="text-xl font-black text-white">{quality?.metrics.jobs.completionRate ?? 0}%</p>
                <p className="text-xs text-slate-500">running {quality?.metrics.jobs.running ?? 0} / failed {quality?.metrics.jobs.failed ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">Notification Success</p>
                <p className="text-xl font-black text-white">{quality?.metrics.notifications.successRate ?? 0}%</p>
                <p className="text-xs text-slate-500">sent {quality?.metrics.notifications.sent ?? 0} / failed {quality?.metrics.notifications.failed ?? 0}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <p className="text-slate-400">Data Freshness</p>
                <p className="text-xl font-black text-white">
                  {quality?.metrics.dataFreshness.ageMinutes !== null && quality?.metrics.dataFreshness.ageMinutes !== undefined
                    ? `${quality.metrics.dataFreshness.ageMinutes}m`
                    : "n/a"}
                </p>
                <p className="text-xs text-slate-500">target &lt;= {quality?.thresholds.freshnessMaxMinutes ?? 180}m</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-black text-white mb-4">Active Alerts</h2>
            <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
              {(alerts?.data ?? []).length === 0 && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-300 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-200">No active alerts</p>
                    <p className="text-xs text-emerald-100/80">현재 경보 없음. 출시 운영 기준 충족 상태입니다.</p>
                  </div>
                </div>
              )}
              {(alerts?.data ?? []).map((alert) => (
                <article key={alert.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-white">{alert.title}</p>
                    <span className={`text-[11px] px-2 py-1 rounded-full border ${levelBadge(alert.level)}`}>{alert.level}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{alert.detail}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-[11px] text-slate-500">source: {alert.source}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runAlertAction(alert.id, "ack")}
                        disabled={actioningId === alert.id}
                        className="text-[11px] px-2 py-1 rounded-md border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-40"
                      >
                        ACK 2H
                      </button>
                      <button
                        onClick={() => runAlertAction(alert.id, "snooze")}
                        disabled={actioningId === alert.id}
                        className="text-[11px] px-2 py-1 rounded-md border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 disabled:opacity-40"
                      >
                        SNOOZE 24H
                      </button>
                      {alert.actionPath ? (
                        <Link href={alert.actionPath} className="inline-flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-blue-200">
                          <Wrench className="w-3.5 h-3.5" />
                          Fix
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-600">n/a</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
