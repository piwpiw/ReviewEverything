"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowUpRight, CheckCircle2, Database, Layers, RefreshCcw, ShieldAlert, Terminal, BarChart3, TerminalSquare } from "lucide-react";
import ScraperStatusTable from "@/components/ScraperStatusTable";
import CsvUploadFallback from "@/components/CsvUploadFallback";
import PlatformManager from "@/components/PlatformManager";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

type IngestStatus = "idle" | "running" | "success" | "error";
type HealthStatus = "ok" | "error" | "checking";

type IngestRun = {
  id: number;
  platform?: { name: string };
  status: string;
  start_time: string;
  records_added: number;
  records_updated: number;
};

type PlatformInfo = { id: number; name: string; is_active?: boolean; adapter_ready?: boolean; adapter_status?: string };

type CampaignMeta = { total: number; page: number; totalPages: number };

type QualityPayload = { status: "ok" | "warn" | "critical"; alerts_count?: number };

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const createLog = (msg: string) => `${new Date().toLocaleTimeString()} ${msg}`;

const statusBadge = (status: HealthStatus | "warn" | "critical") => {
  if (status === "ok") return "text-emerald-300 border-emerald-500/40 bg-emerald-500/10";
  if (status === "warn") return "text-amber-300 border-amber-500/40 bg-amber-500/10";
  return "text-rose-300 border-rose-500/40 bg-rose-500/10";
};

const readApiErrorMessage = async (res: Response) => {
  try {
    const payload = (await res.json()) as { error?: string; message?: string };
    return payload.error || payload.message || `요청 실패 (${res.status})`;
  } catch {
    return `요청 실패 (${res.status})`;
  }
};

const isSetupIssue = (status: number, message: string) => {
  if (status === 401 || status === 403 || status === 503) return true;
  if (!message) return false;
  return /(admin_password|cron_secret|database_url|direct_url|env|database|connection|missing|required)/i.test(message);
};

export default function AdminDashboard() {
  const [runs, setRuns] = useState<IngestRun[]>([]);
  const [runMeta, setRunMeta] = useState<CampaignMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | "all">("all");
  const [dbPlatforms, setDbPlatforms] = useState<PlatformInfo[]>([]);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus>("idle");
  const [logs, setLogs] = useState<string[]>([
    createLog("[시스템] 관리자 콘솔 준비 완료"),
    createLog("[대기] 명령 대기 중입니다."),
  ]);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("checking");
  const [qualityStatus, setQualityStatus] = useState<HealthStatus | "warn" | "critical">("checking");
  const [alertsCount, setAlertsCount] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requiresAdminConfig, setRequiresAdminConfig] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [createLog(msg), ...prev].slice(0, 80));
  }, []);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/runs?limit=30");
      if (!res.ok) {
        const message = await readApiErrorMessage(res);
        if (isSetupIssue(res.status, message)) setRequiresAdminConfig(true);
        throw new Error(message);
      }
      const data = (await res.json()) as { data: IngestRun[]; meta?: CampaignMeta };
      setRuns(data.data || []);
      setRunMeta(data.meta || null);
      setRequiresAdminConfig(false);
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
      if (!res.ok) {
        const message = await readApiErrorMessage(res);
        if (isSetupIssue(res.status, message)) setRequiresAdminConfig(true);
        return;
      }
      const payload = (await res.json()) as PlatformInfo[];
      setDbPlatforms(Array.isArray(payload) ? payload.filter((platform) => platform.is_active !== false) : []);
      setRequiresAdminConfig(false);
    } catch (e) {
      console.error("플랫폼 조회 실패", e);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const [healthRes, campaignRes, qualityRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/campaigns?limit=1"),
        fetch("/api/admin/quality"),
      ]);

      const healthData = healthRes.ok ? ((await healthRes.json()) as { db?: string }) : null;
      setHealthStatus(healthData?.db === "ok" ? "ok" : "error");

      if (campaignRes.ok) {
        const campaignData = (await campaignRes.json()) as { meta?: { total?: number } };
        setTotalCampaigns(toNumber(campaignData?.meta?.total, 0));
      } else if (campaignRes.status === 503) {
        setRequiresAdminConfig(true);
      }

      if (qualityRes.ok) {
        const qualityData = (await qualityRes.json()) as QualityPayload;
        setQualityStatus((qualityData.status as HealthStatus) || "warn");
        setAlertsCount(toNumber(qualityData.alerts_count, 0));
        setRequiresAdminConfig(false);
      } else {
        const qualityError = await readApiErrorMessage(qualityRes);
        if (isSetupIssue(qualityRes.status, qualityError)) setRequiresAdminConfig(true);
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
    if (ingestStatus === "running") return;
    if (requiresAdminConfig) {
      setErrorMessage("관리자 API 설정이 필요합니다. ADMIN_PASSWORD를 Render 환경 변수에 등록하세요.");
      return;
    }

    setIngestStatus("running");
    setErrorMessage(null);

    const targets =
      selectedPlatformId === "all" ? dbPlatforms : dbPlatforms.filter((platform) => platform.id === selectedPlatformId);

    if (targets.length === 0) {
      setErrorMessage("실행할 플랫폼이 없습니다.");
      setIngestStatus("error");
      setTimeout(() => setIngestStatus("idle"), 1800);
      return;
    }

    const targetLabel = selectedPlatformId === "all" ? "전체 플랫폼" : String(selectedPlatformId);
    addLog(`수집 요청: ${targetLabel} (${targets.length}개)`);

    try {
      for (const target of targets) {
        addLog(`POST /api/admin/ingest platform=${target.name}`);
        const res = await fetch("/api/admin/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform_id: target.id }),
        });
        if (!res.ok) {
          const message = await readApiErrorMessage(res);
          if (isSetupIssue(res.status, message)) setRequiresAdminConfig(true);
          throw new Error(message);
        }

        addLog(`${target.name} 수집 요청 승인`);
      }

      setIngestStatus("success");
      addLog("수집 요청 완료");
      await fetchRuns();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "수집 실행에 실패했습니다.";
      setErrorMessage(message);
      setIngestStatus("error");
      addLog(`ERROR: ${message}`);
    } finally {
      setTimeout(() => setIngestStatus("idle"), 3000);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoadingSnapshot(true);
      await Promise.all([fetchRuns(), checkHealth(), fetchPlatforms()]);
      setIsLoadingSnapshot(false);
    };

    void bootstrap();

    const runsTimer = setInterval(fetchRuns, 10000);
    const healthTimer = setInterval(checkHealth, 30000);
    const platformsTimer = setInterval(fetchPlatforms, 60000);
    return () => {
      clearInterval(runsTimer);
      clearInterval(healthTimer);
      clearInterval(platformsTimer);
    };
  }, [checkHealth, fetchRuns, fetchPlatforms]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const successRuns = useMemo(() => runs.filter((run) => run.status === "SUCCESS").length, [runs]);
  const failedRuns = useMemo(() => runs.filter((run) => run.status === "FAILED").length, [runs]);
  const runningRuns = useMemo(() => runs.filter((run) => run.status === "RUNNING").length, [runs]);
  const lastRun = runs[0];
  const lastSyncLabel = lastRun ? new Date(lastRun.start_time).toLocaleString() : "대기";

  const cards = [
    {
      label: "총 인덱스 캠페인",
      value: totalCampaigns?.toLocaleString() ?? "조회중...",
      icon: Database,
      className: statusBadge("ok"),
    },
    {
      label: "성공 수집 건수",
      value: successRuns,
      icon: CheckCircle2,
      className: statusBadge("ok"),
    },
    {
      label: "실패 수집 건수",
      value: failedRuns,
      icon: ShieldAlert,
      className: statusBadge("critical"),
    },
    {
      label: "마지막 동기화",
      value: lastSyncLabel,
      icon: ArrowUpRight,
      className: statusBadge("warn"),
    },
    {
      label: "백그라운드 실행중",
      value: runMeta?.total ?? 0,
      icon: Activity,
      className: statusBadge("ok"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20">
      <main className="max-w-[1680px] mx-auto p-6 space-y-6">
        <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">운영 대시보드</p>
          <h1 className="text-2xl font-black text-white mt-2">관리자 콘솔</h1>
          <p className="text-sm text-slate-400 mt-2">수집, 플랫폼 상태, 분석, 알림 이력을 한 화면에서 운영합니다.</p>
          <button
            onClick={() => void checkHealth()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-black border border-slate-700/50 hover:bg-slate-700"
            disabled={healthStatus === "checking"}
          >
            운영 상태 재점검
          </button>
        </section>

        {errorMessage ? <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-200 px-4 py-3 text-sm">{errorMessage}</div> : null}
        {requiresAdminConfig ? (
          <section className="rounded-lg border border-rose-400/50 bg-rose-500/10 px-4 py-4 text-rose-200 text-sm space-y-3">
            <p className="font-black text-rose-100">관리자 API 인증 설정 필요</p>
            <p className="text-rose-200/90 leading-relaxed">
              관리자 API 요청이 503으로 내려옵니다. Render 환경 변수에 아래 값을 등록하고 재배포하면 즉시 해소됩니다.
            </p>
            <ul className="list-disc list-inside text-xs text-rose-200/90 space-y-1">
              <li><strong>ADMIN_PASSWORD</strong> : 운영자 전용 비밀번호</li>
              <li><strong>CRON_SECRET</strong> : 자동 수집 트리거 토큰</li>
              <li><strong>DATABASE_URL</strong> / <strong>DIRECT_URL</strong> : DB 연결</li>
              <li><strong>NEXT_PUBLIC_KAKAO_JS_KEY</strong> 또는 <strong>NEXT_PUBLIC_NAVER_CLIENT_ID</strong> : 지도 표시</li>
            </ul>
            <p className="text-xs font-black">
              현재 환경: <code className="rounded bg-rose-900/40 px-2 py-0.5">{process.env.NODE_ENV}</code>
            </p>
          </section>
        ) : null}

        <section id="overview" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border border-slate-800 p-6 ${card.className} backdrop-blur`}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{card.label}</h3>
                <card.icon className="w-4 h-4" />
              </div>
              <p className="mt-4 text-2xl font-black text-white break-words">{card.value}</p>
            </div>
          ))}
        </section>

        <section id="control" className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-blue-300" />
                <div>
                  <h2 className="text-lg font-black text-white">수집 실행</h2>
                  <p className="text-xs text-slate-400">선택한 플랫폼을 즉시 수집합니다.</p>
                </div>
              </div>
              <button
                onClick={() => void fetchRuns()}
                disabled={isLoadingSnapshot}
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700"
              >
                <RefreshCcw className={`w-4 h-4 ${isLoadingSnapshot ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => setSelectedPlatformId("all")}
                className={`px-3 py-2 text-xs rounded-xl border font-black ${
                  selectedPlatformId === "all"
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                전체 플랫폼
              </button>
              {dbPlatforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatformId(platform.id)}
                  className={`px-3 py-2 text-xs rounded-xl border font-black ${
                    selectedPlatformId === platform.id
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  {platform.name}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-400 mb-5">
              <div className="rounded-xl border border-slate-800 p-3">
                <p className="text-slate-500 mb-1">수집 상태</p>
                <p className="text-white font-black">
                  {ingestStatus === "running"
                    ? "실행 중"
                    : ingestStatus === "success"
                      ? "요청 완료"
                      : ingestStatus === "error"
                        ? "실패"
                        : "대기"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 p-3">
                <p className="text-slate-500 mb-1">DB 상태</p>
                <p className="text-white font-black">{healthStatus === "ok" ? "정상" : healthStatus === "error" ? "오류" : "확인중"}</p>
              </div>
              <div className="rounded-xl border border-slate-800 p-3">
                <p className="text-slate-500 mb-1">실시간 실행</p>
                <p className="text-white font-black">{runningRuns} / {runs.length}</p>
              </div>
            </div>

            <button
              onClick={triggerIngest}
              disabled={ingestStatus === "running" || requiresAdminConfig}
              className={`w-full py-4 rounded-2xl border border-slate-700 font-black text-sm tracking-wide ${
                ingestStatus === "running"
                  ? "bg-slate-800 text-slate-500"
                  : requiresAdminConfig
                    ? "bg-slate-800 text-rose-300 cursor-not-allowed"
                  : "bg-white text-slate-900 hover:bg-blue-500 hover:text-white"
              }`}
            >
              {requiresAdminConfig
                ? "환경 설정 필요"
                : ingestStatus === "running"
                  ? "수집 실행 중..."
                  : "수집 실행"}
            </button>

            <div
              className="mt-5 border border-slate-800 rounded-2xl p-4 bg-black/40 h-56 overflow-y-auto"
              ref={logContainerRef}
            >
              {isLoading ? <p className="text-slate-500">이전 로그를 불러오는 중입니다.</p> : null}
              {logs.map((log) => (
                <p key={log} className="font-mono text-xs text-emerald-300/90 mb-1">
                  {log}
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
              <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                수집 환경 요약
              </h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>활성 플랫폼</span>
                  <span className="font-black">{dbPlatforms.length}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>알림 건수</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs border ${
                      qualityStatus === "ok"
                        ? "text-emerald-300 border-emerald-500/40 bg-emerald-500/10"
                        : qualityStatus === "warn"
                          ? "text-amber-300 border-amber-500/40 bg-amber-500/10"
                          : "text-rose-300 border-rose-500/40 bg-rose-500/10"
                    }`}
                  >
                    {alertsCount}건
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>총 실행 수</span>
                  <span className="font-black">{runMeta?.total ?? 0}건</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
              <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <TerminalSquare className="w-5 h-5 text-blue-400" />
                운영 바로가기
              </h3>
              <div className="space-y-2">
                <a
                  href="/system"
                  className="block rounded-xl border border-slate-700 p-3 text-sm text-slate-200 hover:bg-slate-800"
                >
                  운영 점검 센터로 이동
                </a>
                <a
                  href="/me"
                  className="block rounded-xl border border-slate-700 p-3 text-sm text-slate-200 hover:bg-slate-800"
                >
                  사용자 대시보드 보기
                </a>
                <a
                  href="/me/console"
                  className="block rounded-xl border border-slate-700 p-3 text-sm text-slate-200 hover:bg-slate-800"
                >
                  프로젝트 콘솔로 이동
                </a>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
              <h3 className="text-lg font-black text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                배치 운영
              </h3>
              <p className="text-sm text-slate-300 mt-2">CSV 업로드 fallback과 수동 보정 기능을 이용해 데이터 정합성을 유지하세요.</p>
              <div className="mt-4">
                <CsvUploadFallback />
              </div>
            </div>
          </div>
        </section>

        <section id="history" className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <h2 className="text-lg font-black text-white mb-4">수집 이력</h2>
          <ScraperStatusTable initialRuns={runs} />
        </section>

        <section id="analysis" className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <h2 className="text-lg font-black text-white mb-4">분석 대시보드</h2>
          <AnalyticsDashboard />
        </section>

        <section id="platforms" className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <h2 className="text-lg font-black text-white mb-4">플랫폼 관리</h2>
          <PlatformManager />
        </section>
      </main>
    </div>
  );
}

