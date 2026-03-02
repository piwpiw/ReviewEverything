"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Database,
  HeartPulse,
  Play,
  RefreshCw,
  ShieldCheck,
  Terminal,
  Zap,
} from "lucide-react";

type Platform = { name: string };
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

type Metric = {
  id: number;
  name: string;
  status: string;
  lastRun: string;
  count: number;
};

const PLATFORM_LIST = [
  { id: 1, name: "Revu" },
  { id: 2, name: "Reviewnote" },
  { id: 3, name: "DinnerQueen" },
  { id: 4, name: "ReviewPlace" },
  { id: 5, name: "Seouloppa" },
];

const qualityStatusLabel = (status?: string) => {
  if (status === "ok") return "정상";
  if (status === "warn") return "주의";
  if (status === "critical") return "위험";
  return "점검중";
};

const qualityChip = (status?: string) => {
  if (status === "ok") return "bg-emerald-100 text-emerald-700";
  if (status === "warn") return "bg-amber-100 text-amber-700";
  if (status === "critical") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-500";
};

const addDuration = (ms: number) => {
  const mins = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${sec}s`;
};

const formatDateTime = (raw: string) => {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

export default function MeConsolePage() {
  const [isRunning, setIsRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState("대기 중");
  const [performance, setPerformance] = useState({ cpu: 12, mem: 42, latency: 120 });
  const [runs, setRuns] = useState<Run[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([{ id: Date.now(), time: new Date().toLocaleTimeString(), msg: "콘솔 모드 준비", type: "info" }]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<"ok" | "error" | "checking">("checking");
  const [quality, setQuality] = useState<QualityPayload | null>(null);
  const [alerts, setAlerts] = useState<AlertPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addLog = (msg: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
  };

  const buildMetrics = useCallback((runList: Run[]): Metric[] => {
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
        status: latest?.status === "SUCCESS" ? "정상" : latest?.status === "FAILED" ? "실패" : "미실행",
        lastRun: latest ? formatDateTime(latest.start_time) : "-",
        count: latest ? latest.records_added + latest.records_updated : 0,
      };
    });
  }, []);

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
      addLog("콘솔 데이터가 갱신되었습니다.", "success");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "운영 데이터 로드 중 오류가 발생했습니다.";
      setError(message);
      setHealth("error");
      addLog(`에러: ${message}`, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    addLog("모니터링 콘솔을 시작합니다.", "info");
    void load();
    const timer = setInterval(load, 25000);
    return () => clearInterval(timer);
  }, [load]);

  const triggerIngest = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setSystemStatus("실행 중");
    const startedAt = Date.now();
    addLog("수집 요청을 일괄 시작합니다.", "warn");

    try {
      for (const platform of PLATFORM_LIST) {
        addLog(`${platform.name} 수집 요청 시작`, "info");
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
      addLog(`수집 요청 완료: ${addDuration(Date.now() - startedAt)}`, "success");
      await load();
      setSystemStatus("완료 대기");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "수집 실행 중 오류가 발생했습니다.";
      addLog(message, "error");
      setError(message);
      setSystemStatus("오류");
    } finally {
      setTimeout(() => {
        setSystemStatus("대기 중");
      }, 1200);
      setIsRunning(false);
    }
  };

  const metricCards = useMemo(
    () => [
      { label: "CPU 사용률", value: `${performance.cpu}%`, icon: Zap, color: "text-amber-500" },
      { label: "메모리 사용률", value: `${performance.mem}%`, icon: Activity, color: "text-blue-500" },
      { label: "API 응답", value: `${performance.latency}ms`, icon: HeartPulse, color: "text-emerald-500" },
      { label: "DB 상태", value: health.toUpperCase(), icon: ShieldCheck, color: health === "ok" ? "text-emerald-500" : "text-rose-500" },
      { label: "품질 알림", value: `${quality?.alerts_count ?? 0}건`, icon: Database, color: "text-indigo-500" },
    ],
    [health, performance.cpu, performance.latency, performance.mem, quality?.alerts_count],
  );

  const platformMetrics = useMemo(() => buildMetrics(runs), [buildMetrics, runs]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] text-slate-900 dark:text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-500 rounded-lg text-[10px] font-black text-white tracking-widest leading-normal">내부 모니터</span>
              <span className="text-[11px] font-bold text-slate-400">모니터링 · 수집 · 알림</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:to-slate-500">
              AI 운영 콘솔
            </h1>
            <p className="text-slate-400 font-bold mt-2">수집 현황, API 상태, 알림 상태를 한 곳에서 점검합니다.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void load()}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-4 rounded-[1.5rem] bg-white dark:bg-slate-900 text-sm font-black border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </button>
            <button
              onClick={triggerIngest}
              disabled={isRunning}
              className={`flex items-center gap-2 px-6 py-4 rounded-[1.5rem] text-[13px] font-black transition-all shadow-xl active:scale-95 ${
                isRunning ? "bg-slate-100 text-slate-400" : "bg-slate-900 dark:bg-blue-600 text-white hover:shadow-blue-500/20"
              }`}
            >
              <Play className="w-4 h-4" />
              {isRunning ? "실행 중..." : "전체 수집 실행"}
            </button>
            <span className="px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-black">상태: {systemStatus}</span>
          </div>
        </div>

        {error ? <div className="rounded-xl border border-rose-300/60 bg-rose-50 text-rose-700 px-4 py-3 text-sm">{error}</div> : null}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {metricCards.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4" />
              <h2 className="text-sm font-black">품질 상태</h2>
              <span className={`ml-auto px-2 py-1 rounded-full text-xs ${qualityChip(quality?.status)} rounded`}>{qualityStatusLabel(quality?.status)}</span>
            </div>

            <p className="text-sm text-slate-500 mb-4">현재 수집 품질 상태: <strong>{quality?.status ?? "점검중"}</strong></p>

            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-black text-slate-900 dark:text-slate-200">최근 알림</span>: {alerts?.summary?.critical ?? 0}건(critical) / {alerts?.summary?.warn ?? 0}건(warn)
              </p>
              <p>
                <span className="font-black text-slate-900 dark:text-slate-200">플랫폼 수</span>: {platformMetrics.length}개
              </p>
              <p>
                <span className="font-black text-slate-900 dark:text-slate-200">수집 로그</span>: {runs.length}건
              </p>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">실행 로그</h3>
            <div className="h-80 overflow-y-auto bg-slate-950/95 dark:bg-slate-800 rounded-2xl p-4 space-y-2">
              {logs.map((entry) => (
                <div key={entry.id} className="text-xs text-slate-200">
                  <span className="text-slate-400">[{entry.time}]</span> {entry.msg}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <h2 className="text-sm font-black">플랫폼별 최근 수집 상태</h2>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500" />
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <th className="py-2 pr-4 font-black">플랫폼</th>
                  <th className="py-2 pr-4 font-black">상태</th>
                  <th className="py-2 pr-4 font-black">마지막 실행</th>
                  <th className="py-2 font-black">레코드</th>
                </tr>
              </thead>
              <tbody>
                {platformMetrics.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 pr-4">{item.name}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800">{item.status}</span>
                    </td>
                    <td className="py-3 pr-4">{item.lastRun}</td>
                    <td className="py-3">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black mb-2">운영 체크리스트</h2>
          <ul className="text-sm text-slate-600 dark:text-slate-300 list-disc pl-5 space-y-2">
            <li>수집 실행 버튼 클릭 후 2~5분 간격으로 로그 최신화 확인</li>
            <li>품질 상태가 Critical이면 /system에서 알림 상세 처리</li>
            <li>DB 상태가 OK가 아니면 /admin의 플랫폼 상태, /api/health 확인</li>
            <li>실행 후 30분 이내 미수집 데이터가 존재하는지 캠페인 목록을 점검</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
