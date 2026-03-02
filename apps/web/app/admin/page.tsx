"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Database,
  RefreshCcw,
  CheckCircle2,
  Layers,
  Terminal,
  BarChart3,
  ShieldAlert,
  Cpu,
  Globe,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import ScraperStatusTable from "@/components/ScraperStatusTable";
import CsvUploadFallback from "@/components/CsvUploadFallback";
import PlatformManager from "@/components/PlatformManager";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { motion } from "framer-motion";

const PLATFORM_LIST = [
  { id: 1, name: "Revu", color: "#3b82f6" },
  { id: 2, name: "Reviewnote", color: "#8b5cf6" },
  { id: 3, name: "DinnerQueen", color: "#f59e0b" },
  { id: 4, name: "ReviewPlace", color: "#10b981" },
  { id: 5, name: "Seouloppa", color: "#ef4444" },
  { id: 6, name: "MrBlog", color: "#6366f1" },
  { id: 7, name: "GangnamFood", color: "#f97316" },
] as const;

type IngestStatus = "idle" | "triggering" | "success" | "error";
type HealthStatus = "ok" | "error" | "checking";

type IngestRun = {
  id: number;
  platform?: { name: string };
  status: string;
  start_time: string;
  records_added: number;
  records_updated: number;
};

type CampaignMeta = { total: number; page: number; totalPages: number };

const createLog = (msg: string) => `${new Date().toLocaleTimeString()} ${msg}`;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function AdminDashboard() {
  const [runs, setRuns] = useState<IngestRun[]>([]);
  const [runMeta, setRunMeta] = useState<CampaignMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | "all">("all");
  const [dbPlatforms, setDbPlatforms] = useState<any[]>([]);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus>("idle");
  const [logs, setLogs] = useState<string[]>(["[시스템] 대시보드가 초기화되었습니다.", "[준비] 사용자 명령 대기 중입니다."]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [qualityStatus, setQualityStatus] = useState<HealthStatus | "warn" | "critical">("checking");
  const [alertsCount, setAlertsCount] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [createLog(msg), ...prev].slice(0, 80));
  }, []);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/runs?limit=30");
      if (!res.ok) throw new Error(`수집 이력 API 호출 실패 (${res.status})`);
      const data = (await res.json()) as { data: IngestRun[]; meta?: CampaignMeta };
      setRuns(data.data || []);
      setRunMeta(data.meta || null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "수집 이력 조회에 실패했습니다.";
      setErrorMessage(message);
      addLog(`오류: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/platforms");
      if (res.ok) {
        const data = await res.json();
        setDbPlatforms(data.filter((p: any) => p.is_active));
      }
    } catch (e) {
      console.error("활성 플랫폼 조회 실패", e);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const [healthRes, campRes, qualityRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/campaigns?limit=1"),
        fetch("/api/admin/quality"),
      ]);
      const healthData = healthRes.ok ? ((await healthRes.json()) as { db?: string }) : null;
      setHealthStatus(healthData?.db === "ok" ? "ok" : "error");

      if (campRes.ok) {
        const campData = (await campRes.json()) as { meta?: { total?: number } };
        setTotalCampaigns(toNumber(campData?.meta?.total, 0));
      }

      if (qualityRes.ok) {
        const qualityData = (await qualityRes.json()) as { status?: "ok" | "warn" | "critical"; alerts_count?: number };
        setQualityStatus((qualityData.status as HealthStatus) || "warn");
        setAlertsCount(toNumber(qualityData.alerts_count, 0));
      } else {
        setQualityStatus("warn");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "상태 점검에 실패했습니다.";
      setErrorMessage(message);
      setHealthStatus("error");
      setQualityStatus("critical");
    }
  }, []);

  const triggerIngest = async () => {
    if (ingestStatus === "triggering") return;
    setIngestStatus("triggering");
    setErrorMessage(null);
    addLog(`수동 수집 실행: ${selectedPlatformId === "all" ? "전체 플랫폼" : `플랫폼 ${selectedPlatformId}`}`);

    const targets =
      selectedPlatformId === "all" ? dbPlatforms : dbPlatforms.filter((platform) => platform.id === selectedPlatformId);

    try {
      for (const target of targets) {
        addLog(`POST /api/admin/ingest platform=${target.name}`);
        const res = await fetch("/api/admin/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform_id: target.id }),
        });
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || `${target.name} 수집 시작 실패`);
        }
        addLog(`${target.name} 수집 요청 승인`);
      }
      setIngestStatus("success");
      setTimeout(fetchRuns, 2000);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "수집 실행에 실패했습니다.";
      setErrorMessage(message);
      setIngestStatus("error");
      addLog(`ERROR: ${message}`);
    } finally {
      setTimeout(() => setIngestStatus("idle"), 5000);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoadingSnapshot(true);
      await Promise.all([fetchRuns(), checkHealth(), fetchPlatforms()]);
      setIsLoadingSnapshot(false);
    };
    bootstrap();
    const runsTimer = setInterval(fetchRuns, 10000);
    const healthTimer = setInterval(checkHealth, 30000);
    const platformsTimer = setInterval(fetchPlatforms, 60000);
    return () => {
      clearInterval(runsTimer);
      clearInterval(healthTimer);
      clearInterval(platformsTimer);
    };
  }, [fetchRuns, checkHealth, fetchPlatforms]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const successRuns = useMemo(() => runs.filter((run) => run.status === "SUCCESS").length, [runs]);
  const failedRuns = useMemo(() => runs.filter((run) => run.status === "FAILED").length, [runs]);
  const lastRun = runs[0];
  const lastSyncLabel = lastRun ? new Date(lastRun.start_time).toLocaleTimeString() : "IDLE";

  const statCards = [
    { label: "색인 건수", val: totalCampaigns?.toLocaleString() ?? "조회 중...", icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "성공 수집", val: successRuns, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "시스템 오류", val: failedRuns, icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "마지막 동기화", val: lastSyncLabel, icon: ArrowUpRight, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "총 실행 수", val: runMeta?.total ?? 0, icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-400 font-sans selection:bg-blue-500/30 pb-40">
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-[100]">
        <div className="max-w-[1700px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">운영센터 01</span>
                <h1 className="text-sm font-black text-white leading-none">수집 제어 패널</h1>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${healthStatus === "ok" ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <span className="text-[10px] font-black uppercase">DB 연결</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${qualityStatus === "ok" ? "bg-emerald-500" : qualityStatus === "warn" ? "bg-amber-500" : "bg-rose-500"}`} />
                <span className="text-[10px] font-black uppercase">운영 상태 {qualityStatus.toUpperCase()}</span>
                <span className="text-[10px] font-black text-slate-500">알림 {alertsCount}건</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">{dbPlatforms.length}개 활성 플랫폼</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/system" className="px-5 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black hover:bg-blue-500 transition-all border border-blue-500/50 shadow-inner">
              운영 제어 열기
            </Link>
            <Link href="/" className="px-5 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black hover:bg-slate-700 transition-all border border-slate-700/50 shadow-inner">
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto p-6 flex flex-col gap-6 mt-4">
        {errorMessage ? <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">{errorMessage}</div> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/80 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-[30px] group-hover:bg-white/10 transition-all" />
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-2xl`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black tracking-[0.2em] text-slate-500">NODE_{i + 1}</span>
              </div>
              <div className="text-3xl font-black text-white mb-1">{stat.val}</div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800/80 shadow-2xl p-8">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-black text-white flex items-center gap-3 italic">
                    <Terminal className="w-5 h-5 text-blue-500" />
                    COMMAND_DESK_V2
                  </h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">플랫폼 전체 수집을 수동으로 실행합니다.</p>
                </div>
                <button
                  onClick={fetchRuns}
                  className="p-3 bg-slate-800/50 rounded-2xl text-slate-400 hover:text-white transition-all border border-slate-700/50 active:rotate-180 duration-500"
                  disabled={isLoadingSnapshot}
                >
                  <RefreshCcw className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-10">
                <button
                  onClick={() => setSelectedPlatformId("all")}
                  className={`px-3 py-3 rounded-2xl text-[10px] font-black transition-all border ${
                    selectedPlatformId === "all"
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-500/40"
                      : "bg-slate-800/50 text-slate-500 border-slate-700/50 hover:border-slate-500"
                  }`}
                >
                  전체 플랫폼
                </button>
                {dbPlatforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatformId(platform.id)}
                    className={`px-3 py-3 rounded-2xl text-[10px] font-black transition-all border ${
                      selectedPlatformId === platform.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-500/40"
                        : "bg-slate-800/50 text-slate-500 border-slate-700/50 hover:border-slate-500"
                    }`}
                  >
                    {platform.name.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 p-10 rounded-[2.5rem] bg-black/40 border border-slate-800/50 items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:rotate-12 transition-transform">
                        <Layers className="w-10 h-10" />
                      </div>
                      {ingestStatus === "triggering" ? <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-[2rem] animate-spin" /> : null}
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">대상 클러스터</div>
                      <div className="text-3xl font-black text-white tracking-tighter">
                        {selectedPlatformId === "all" ? "전체 파이프라인" : dbPlatforms.find((platform) => platform.id === selectedPlatformId)?.name}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[9px] font-black text-emerald-500/80 uppercase">명령 대기 중</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={triggerIngest}
                    disabled={ingestStatus === "triggering"}
                    className={`group relative overflow-hidden px-12 py-7 rounded-[2rem] font-black text-xs tracking-[0.2em] transition-all ${
                      ingestStatus === "triggering"
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-white text-slate-900 hover:bg-blue-600 hover:text-white transform active:scale-95 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)]"
                    }`}
                  >
                    <span className="relative z-10">{ingestStatus === "triggering" ? "실행 중..." : "수집 실행"}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase flex items-center gap-2">
                      <Terminal className="w-3 h-3 text-emerald-500" />
                      운영 터미널
                    </span>
                    <span className="text-[10px] font-bold text-slate-600">연결: TCP/IP + SSL</span>
                  </div>
                  <div
                    ref={logContainerRef}
                    className="h-44 bg-black/80 rounded-[2rem] p-6 font-mono text-[11px] text-emerald-500/90 leading-relaxed overflow-y-auto border border-slate-800/60 shadow-inner custom-scrollbar"
                  >
                    {isLoading ? <p>로그를 불러오는 중...</p> : null}
                    {logs.map((log, i) => (
                      <div key={`${log}-${i}`} className="mb-1 opacity-80 hover:opacity-100 transition-opacity">
                        <span className="text-slate-600 mr-2">root@system:~$</span>
                        {log}
                      </div>
                    ))}
                    {ingestStatus === "triggering" ? <div className="animate-pulse">_</div> : null}
                  </div>
                </div>
              </div>
            </div>

            {/* --- Market Analytics Section --- */}
            <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800/80 shadow-2xl p-8 mb-6 mt-4 relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex flex-col gap-1 mb-10 text-center relative z-10">
                <h2 className="text-2xl font-black text-white flex items-center justify-center gap-3 italic tracking-tighter">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                  MARKET_INTELLIGENCE_CENTER
                </h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">Advanced cross-platform metrics and trend analysis.</p>
              </div>
              <AnalyticsDashboard />
            </div>

            <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800/80 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-slate-800/60 flex justify-between items-center bg-slate-900/30">
                <h3 className="text-sm font-black text-white flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-emerald-500" />
                  파이프라인 실행 기록
                </h3>
                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-3 py-1 bg-black/40 rounded-full border border-slate-800">최근 30건</div>
              </div>
              <ScraperStatusTable initialRuns={runs} />
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800/80 p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3 relative z-10 italic">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                안전 제어
              </h3>
              <CsvUploadFallback />
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-[2s]" />
              <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                <Zap className="w-6 h-6 text-amber-300" />
                하이퍼 수집 AI
              </h3>
              <p className="text-sm text-blue-100/70 mb-8 leading-relaxed font-bold">
                IP 로테이션과 동적 재시도로 고성능 모드가 동작 중입니다.
              </p>
              <div className="space-y-5 relative z-10">
                {[
                  { k: "동시 실행 수", v: "15개 워커" },
                  { k: "인코딩", v: "Strict UTF-8 (BOM 없음)" },
                  { k: "우회 방식", v: "User-Agent 자동 회전" },
                  { k: "보호 정책", v: "속도 제한 자동 조절" },
                ].map((item) => (
                  <div key={item.k} className="flex justify-between text-[11px] font-black border-b border-white/10 pb-3">
                    <span className="text-blue-200 uppercase tracking-widest">{item.k}</span>
                    <span className="text-white">{item.v}</span>
                  </div>
                ))}
              </div>
              <button className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all">
                상세 로그 열기
              </button>
            </div>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800/80 shadow-2xl p-8 mt-6">
          <div className="flex flex-col gap-1 mb-8">
            <h2 className="text-xl font-black text-white flex items-center gap-3 italic">
              <Globe className="w-5 h-5 text-blue-500" />
              플랫폼 도메인 관리자
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">도메인 일괄 동기화로 수집 대상을 등록·수정합니다.</p>
          </div>
          <PlatformManager />
        </div>
      </div>
    </div>
  );
}
