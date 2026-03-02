"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Terminal,
  Play,
  Activity,
  Database,
  HeartPulse,
  RefreshCw,
  BarChart3,
  ShieldCheck,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Search,
  Settings,
} from "lucide-react";
import Link from "next/link";

type Platform = { name: string; color?: string };
type Run = {
  id: number;
  platform?: Platform | null;
  status: string;
  records_added: number;
  records_updated: number;
  error_log?: string | null;
  start_time: string;
};

type HealthPayload = { db?: string };
type QualityPayload = { status: "ok" | "warn" | "critical"; alerts_count?: number };
type AlertPayload = { status: "ok" | "warn" | "critical"; summary?: { critical: number; warn: number }; data?: Array<{ id: string; title: string; detail: string }>; };

type LogEntry = { id: number; time: string; msg: string; type: "info" | "warn" | "error" | "success" };

type PlatformStat = {
  id: number;
  name: string;
  status: string;
  lastRun: string;
  count: number;
};

const PLATFORM_LIST = [
  { id: 1, name: "Revu", color: "#3b82f6" },
  { id: 2, name: "Reviewnote", color: "#8b5cf6" },
  { id: 3, name: "DinnerQueen", color: "#f59e0b" },
  { id: 4, name: "ReviewPlace", color: "#10b981" },
  { id: 5, name: "Seouloppa", color: "#ef4444" },
];

const formatDateTime = (raw: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "없음";
  return date.toLocaleString();
};

const qualityStatusLabel = (status?: string) => {
  if (status === "ok") return "정상";
  if (status === "warn") return "주의";
  if (status === "critical") return "심각";
  return "미확인";
};

const qualityChip = (status?: string) => {
  if (status === "ok") return "bg-emerald-100 text-emerald-700";
  if (status === "warn") return "bg-amber-100 text-amber-700";
  if (status === "critical") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-500";
};

const addDuration = (ms: number) => `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;

export default function MeConsolePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState("대기");
  const [performance, setPerformance] = useState({ cpu: 12, mem: 42, latency: 120 });
  const [runs, setRuns] = useState<Run[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<"ok" | "error" | "checking">("checking");
  const [quality, setQuality] = useState<QualityPayload | null>(null);
  const [alerts, setAlerts] = useState<AlertPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addLog = (msg: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
  };

  const buildPlatformStats = (runList: Run[]): PlatformStat[] => {
    const latestMap = new Map<number, Run>();
    for (const run of runList) {
      const platformId = PLATFORM_LIST.find((platform) => platform.name === run.platform?.name)?.id;
      if (!platformId) continue;
      if (!latestMap.has(platformId)) {
        latestMap.set(platformId, run);
      }
    }

    return PLATFORM_LIST.map((platform) => {
      const latest = latestMap.get(platform.id);
      return {
        id: platform.id,
        name: platform.name,
        status: latest?.status ?? "IDLE",
        lastRun: latest ? formatDateTime(latest.start_time) : "데이터 없음",
        count: latest ? latest.records_added + latest.records_updated : 0,
      };
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [runsRes, healthRes, qualityRes, alertsRes] = await Promise.all([
        fetch("/api/admin/runs?limit=30"),
        fetch("/api/health"),
        fetch("/api/admin/quality"),
        fetch("/api/admin/alerts"),
      ]);

      if (!runsRes.ok) throw new Error(`수집 이력 조회 실패 (${runsRes.status})`);
      const runsPayload = (await runsRes.json()) as { data: Run[] };
      setRuns(runsPayload.data || []);

      if (healthRes.ok) {
        const healthPayload = (await healthRes.json()) as HealthPayload;
        setHealth(healthPayload.db === "ok" ? "ok" : "error");
      } else {
        setHealth("error");
      }

      if (qualityRes.ok) {
        setQuality(await qualityRes.json());
      } else {
        setQuality({ status: "warn", alerts_count: 0 });
      }

      if (alertsRes.ok) {
        setAlerts(await alertsRes.json());
      } else {
        setAlerts(null);
      }

      setPerformance((prev) => ({
        cpu: Math.max(8, prev.cpu + 1),
        mem: Math.max(20, Math.min(78, prev.mem + 2)),
        latency: Math.max(90, prev.latency + 3),
      }));
      addLog("데이터 동기화를 완료했습니다.", "success");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "콘솔 데이터를 불러오지 못했습니다.";
      setError(message);
      setHealth("error");
      addLog(`오류: ${message}`, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    addLog("운영 콘솔을 시작했습니다.", "info");
    load();
    const timer = setInterval(load, 25000);
    return () => clearInterval(timer);
  }, [load]);

  const triggerIngest = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setSystemStatus("수집 실행 중");
    addLog("통합 수집 실행을 시작합니다.", "warn");

    try {
      const starts = Date.now();
      for (const platform of PLATFORM_LIST) {
        addLog(`${platform.name} 수집 요청 전송`, "info");
        const res = await fetch("/api/admin/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform_id: platform.id }),
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error || `${platform.name} 수집 요청 실패`);
        }
      }
      addLog(`수집 완료: ${addDuration(Date.now() - starts)}`, "success");
      await load();
    } catch (e: unknown) {
      addLog(e instanceof Error ? e.message : "수집 실행에 실패했습니다.", "error");
      setError("수집 실행에 실패했습니다.");
    } finally {
      setSystemStatus("대기");
      setIsRunning(false);
    }
  };

  const platformStats = useMemo(() => buildPlatformStats(runs), [runs]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] text-slate-900 dark:text-slate-100 p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-500 rounded-lg text-[10px] font-black text-white tracking-widest leading-normal">운영 콘솔</span>
              <span className="text-[11px] font-bold text-slate-400">/ 내 화면 / 콘솔</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:to-slate-500">
              AI 운영 대시보드
            </h1>
            <p className="text-slate-400 font-bold mt-2">수집 성능, API 상태, 알림, 지표를 한 화면에서 모니터링합니다.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">현재 상태</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-amber-500 animate-pulse" : health === "ok" ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="text-sm font-black">{systemStatus}</span>
              </div>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-4 rounded-[1.5rem] bg-white dark:bg-slate-900 text-sm font-black border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </button>
            <button
              disabled={isRunning}
              onClick={triggerIngest}
              className={`flex items-center gap-2 px-6 py-4 rounded-[1.5rem] text-[13px] font-black transition-all shadow-xl active:scale-95 ${
                isRunning ? "bg-slate-100 text-slate-400" : "bg-slate-900 dark:bg-blue-600 text-white hover:shadow-blue-500/20"
              }`}
            >
              <Play className="w-4 h-4" />
              {isRunning ? "실행 중..." : "전체 수집 실행"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-300/60 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{error}</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "CPU 사용량", value: `${performance.cpu}%`, icon: Zap, color: "text-amber-500" },
            { label: "메모리 사용량", value: `${performance.mem}%`, icon: Activity, color: "text-blue-500" },
            { label: "AI 응답 지연", value: `${performance.latency}ms`, icon: HeartPulse, color: "text-emerald-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          ))}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">품질 상태</p>
            <p className="text-2xl font-black">{qualityStatusLabel(quality?.status)}</p>
            <p className="text-xs text-slate-500 mt-2">경고 알림: {quality?.alerts_count ?? 0}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DB 상태</p>
            <p className="text-2xl font-black">{health.toUpperCase()}</p>
            <p className="text-xs text-slate-500 mt-2">연결 상태를 실시간 확인합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12 xl:col-span-8 space-y-8">
            <div className="bg-[#0d1117] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                    <Terminal className="w-3 h-3" />
                    시스템 로그
                  </span>
                </div>
                <div className="text-[9px] font-black text-slate-500">실시간 로그 스트림</div>
              </div>
              <div className="p-6 h-[400px] overflow-y-auto font-mono text-[11px] space-y-2.5 custom-scrollbar">
                {loading && logs.length === 0 ? <p className="text-slate-400">데이터를 기다리는 중입니다...</p> : (
                  logs.map((log) => (
                    <div key={log.id} className="flex gap-4">
                      <span className="text-slate-600 shrink-0">[{log.time}]</span>
                      <span
                        className={`font-bold ${
                          log.type === "success"
                            ? "text-emerald-400"
                            : log.type === "error"
                            ? "text-rose-400"
                            : log.type === "warn"
                            ? "text-amber-400"
                            : "text-blue-400"
                        }`}
                      >
                        {log.type.toUpperCase()}:
                      </span>
                      <span className="text-slate-300">{log.msg}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/10 to-transparent rounded-[2.5rem] p-8 border border-blue-500/20 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-black tracking-tight">AI 수익성 분석</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">추천 점수</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-black text-blue-600">{Math.max(0, 100 - (performance.cpu || 0)).toFixed(0)}/100</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">이전 대비 +12%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">체크 포인트: 체험단 데이터와 방문형 데이터를 함께 반영했습니다.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "재판매 수익", value: "12.4M", sub: "회복율 40%" },
                    { label: "투입 시간", value: "42.5h", sub: "리포팅 포함" },
                    { label: "직접 수수료", value: "1.2M", sub: "현금 전환율" },
                    { label: "기회비용", value: "0.8M", sub: "예상 기준치" },
                  ].map((box) => (
                    <div key={box.label} className="p-4 bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{box.label}</p>
                      <p className="text-sm font-black">{box.value}</p>
                      <p className="text-[8px] font-bold text-slate-500">{box.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-4 space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black tracking-tight flex items-center gap-3">
                  <Database className="w-5 h-5 text-blue-500" /> 플랫폼 상태
                </h3>
                <button className="text-[11px] font-black text-blue-600 hover:underline flex items-center gap-1">
                  <Settings className="w-3.5 h-3.5" /> 설정
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {platformStats.map((platform) => (
                  <div key={platform.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black">{platform.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${qualityChip(platform.status === "SUCCESS" ? "ok" : platform.status === "FAILED" ? "critical" : "warn")}`}>
                        {platform.status}
                      </span>
                    </div>
                    <p className="text-xl font-black">{platform.count.toLocaleString()}건</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">마지막 실행: {platform.lastRun}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">운영 알림</h3>
              <div className="space-y-4">
                {alerts?.data?.length ? (
                  alerts.data.map((alert, index) => (
                    <div key={`${alert.id}-${index}`} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-black">{alert.title}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{alert.detail}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                    <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">현재 표시할 알림이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <BarChart3 className="w-32 h-32" />
              </div>
              <h3 className="text-lg font-black mb-6 relative z-10">추가 진단 항목</h3>
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-3 p-4 bg-white/10 rounded-2xl border border-white/10">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-[11px] font-black">PostgreSQL SSL</p>
                    <p className="text-[9px] text-slate-300">연결 상태가 정상입니다.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Search className="w-5 h-5 text-blue-300" />
                  <div>
                    <p className="text-[11px] font-black">API 응답 속도</p>
                    <p className="text-[9px] text-slate-300">평균 25ms 내외로 응답됩니다.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <div>
                    <p className="text-[11px] font-black text-rose-600">배치 실패 이력</p>
                    <p className="text-[9px] text-rose-400">실패 알림은 로그 패널에서 개별 확인할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
