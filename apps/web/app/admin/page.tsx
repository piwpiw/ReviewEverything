"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, ArrowUpRight, CheckCircle2, Database, PlayCircle, RefreshCcw, ShieldAlert, Terminal, TerminalSquare, TimerReset, Wrench, History } from "lucide-react";
import ReviewerManager from "@/components/ReviewerManager";
import SystemSettingsManager from "@/components/SystemSettingsManager";
import CampaignManager from "@/components/CampaignManager";
import ScraperStatusTable from "@/components/ScraperStatusTable";
import { getHealthStatusTone, getStatusToneBadgeClass, getStatusToneLabel } from "@/lib/statusTone";
import { Lock, Settings } from "lucide-react";

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
type RequestPhase = "idle" | "sending" | "accepted" | "queued" | "completed" | "failed" | "blocked";
type RequestedTarget = { id: number; name: string };
const REQUEST_TRACKING_TTL_MS = 10 * 60 * 1000;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const createLog = (msg: string) => `${new Date().toLocaleTimeString()} ${msg}`;

const statusBadge = (status: HealthStatus | "warn" | "critical") => getStatusToneBadgeClass(getHealthStatusTone(status));
const runStatusLabel = (status: string) => {
  if (status === "SUCCESS") return "성공";
  if (status === "FAILED") return "실패";
  if (status === "RUNNING") return "실행 중";
  if (status === "QUEUED") return "큐 적재";
  if (status === "PENDING") return "대기";
  return status;
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
  return /(admin_password|cron_secret|database_url|direct_url|env|database|connection|missing|required|unauthorized_admin)/i.test(message);
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
  const [, setQualityStatus] = useState<HealthStatus | "warn" | "critical">("checking");
  const [alertsCount, setAlertsCount] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [requiresAdminConfig, setRequiresAdminConfig] = useState(false);
  const [lastIngestMessage, setLastIngestMessage] = useState<string | null>(null);
  const [requestPhase, setRequestPhase] = useState<RequestPhase>("idle");
  const [requestedTargets, setRequestedTargets] = useState<RequestedTarget[]>([]);
  const [requestTrackedAt, setRequestTrackedAt] = useState<number | null>(null);
  const [adminPassword, setAdminPassword] = useState<string>("");
  const [isPasswordStored, setIsPasswordStored] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const getAdminHeader = useCallback(() => ({
      "x-admin-password": adminPassword || (typeof window !== "undefined" ? window.sessionStorage.getItem("re_admin_pwd") || "" : "")
  }), [adminPassword]);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [createLog(msg), ...prev].slice(0, 80));
  }, []);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/runs?limit=30", {
          headers: getAdminHeader()
      });

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
  }, [addLog, getAdminHeader]);

  const fetchPlatforms = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/platforms", {
          headers: getAdminHeader()
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res);
        if (isSetupIssue(res.status, message)) setRequiresAdminConfig(true);
        return;
      }
      const data = (await res.json()) as PlatformInfo[] | { platforms: PlatformInfo[] };
      const list = Array.isArray(data) ? data : (data.platforms || []);
      setDbPlatforms(list.filter((platform) => platform.is_active !== false));
      setRequiresAdminConfig(false);
    } catch (e) {
      console.error("플랫폼 조회 실패", e);
    }
  }, [getAdminHeader]);

  const checkHealth = useCallback(async () => {
    try {
      const [healthRes, campaignRes, qualityRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/campaigns?limit=1"),
        fetch("/api/admin/quality", { headers: getAdminHeader() }),
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
  }, [getAdminHeader]);

  const triggerIngest = async () => {
    if (ingestStatus === "running") return;
    if (requiresAdminConfig) {
      setErrorMessage("관리자 API 설정이 필요합니다. ADMIN_PASSWORD를 배포 환경 변수에 등록하세요.");
      setRequestPhase("blocked");
      return;
    }
    if (!isPasswordStored) {
        setErrorMessage("관리자 비밀번호를 입력해야 수집을 실행할 수 있습니다.");
        setRequestPhase("blocked");
        return;
    }

    setIngestStatus("running");
    setRequestPhase("sending");
    setErrorMessage(null);
    setLastIngestMessage(null);

    const targets =
      selectedPlatformId === "all" ? dbPlatforms : dbPlatforms.filter((platform) => platform.id === selectedPlatformId);

    if (targets.length === 0) {
      setErrorMessage("실행할 플랫폼이 없습니다.");
      setIngestStatus("error");
      setRequestPhase("failed");
      setTimeout(() => setIngestStatus("idle"), 1800);
      return;
    }

    const targetLabel = selectedPlatformId === "all" ? "전체 플랫폼" : String(selectedPlatformId);
    setRequestedTargets(targets.map((target) => ({ id: target.id, name: target.name })));
    setRequestTrackedAt(Date.now());
    addLog(`수집 요청: ${targetLabel} (${targets.length}개)`);
    setLastIngestMessage(`${targetLabel}: 요청 전송됨 (${targets.length}개)`);

    try {
      const requests = targets.map((target) =>
        fetch("/api/admin/ingest", {
          method: "POST",
          headers: { 
              "Content-Type": "application/json",
              ...getAdminHeader()
          },
          body: JSON.stringify({ platform_id: target.id }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const message = await readApiErrorMessage(res);
              if (isSetupIssue(res.status, message)) setRequiresAdminConfig(true);
              return { target: target.name, ok: false, message };
            }
            const payload = (await res.json().catch(() => null)) as { message?: string } | null;
            return { target: target.name, ok: true, message: payload?.message || "요청 승인" };
          })
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "요청 실패";
            return { target: target.name, ok: false, message };
          }),
      );

      const results = await Promise.all(requests);
      const failure = results.find((result) => !result.ok);
      if (failure) {
        throw new Error(failure.message || `${failure.target} 수집 요청 실패`);
      }

      setRequestPhase("accepted");
      setLastIngestMessage(`${targetLabel}: 요청 승인 후 큐 적재 중`);

      for (const result of results) {
        addLog(`${result.target} ${result.message || "요청 승인"}`);
      }

      setIngestStatus("success");
      setRequestPhase("queued");
      addLog("수집 요청 완료, 큐 상태를 확인합니다.");
      await fetchRuns();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "수집 실행에 실패했습니다.";
      setErrorMessage(message);
      setIngestStatus("error");
      setRequestPhase("failed");
      addLog(`ERROR: ${message}`);
      setLastIngestMessage(`요청 실패: ${message}`);
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

    const shouldRefresh = () => document.visibilityState === "visible";
    const runsTimer = setInterval(() => {
      if (shouldRefresh()) void fetchRuns();
    }, 20000);
    const healthTimer = setInterval(() => {
      if (shouldRefresh()) void checkHealth();
    }, 45000);
    const platformsTimer = setInterval(() => {
      if (shouldRefresh()) void fetchPlatforms();
    }, 90000);
    return () => {
      clearInterval(runsTimer);
      clearInterval(healthTimer);
      clearInterval(platformsTimer);
    };
  }, [checkHealth, fetchRuns, fetchPlatforms]);

  useEffect(() => {
    if (typeof window !== "undefined") {
        const stored = window.sessionStorage.getItem("re_admin_pwd");
        if (stored) {
            setAdminPassword(stored);
            setIsPasswordStored(true);
        }
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
        window.sessionStorage.setItem("re_admin_pwd", adminPassword);
        setIsPasswordStored(true);
        void checkHealth();
        void fetchRuns();
    }
  };


  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const successRuns = useMemo(() => runs.filter((run) => run.status === "SUCCESS").length, [runs]);
  const failedRuns = useMemo(() => runs.filter((run) => run.status === "FAILED").length, [runs]);
  const runningRuns = useMemo(() => runs.filter((run) => run.status === "RUNNING").length, [runs]);
  const pendingRuns = useMemo(() => runs.filter((run) => run.status === "PENDING" || run.status === "QUEUED").length, [runs]);
  const queueDepth = pendingRuns + runningRuns;
  const lastRun = runs[0];
  const lastSyncLabel = lastRun ? new Date(lastRun.start_time).toLocaleString() : "대기";
  useEffect(() => {
    if (requiresAdminConfig) {
      setRequestPhase("blocked");
      return;
    }
    if (ingestStatus === "error") {
      setRequestPhase("failed");
      return;
    }
    if (queueDepth > 0) {
      setRequestPhase("queued");
      return;
    }
    if (ingestStatus === "success") {
      setRequestPhase("completed");
    }
  }, [ingestStatus, queueDepth, requiresAdminConfig]);

  useEffect(() => {
    if (!requestTrackedAt || requestedTargets.length === 0) return;
    const timeout = window.setTimeout(() => {
      setRequestedTargets([]);
      setRequestTrackedAt(null);
    }, REQUEST_TRACKING_TTL_MS);
    return () => window.clearTimeout(timeout);
  }, [requestTrackedAt, requestedTargets.length]);

  const requestStateLabel = (() => {
    if (requestPhase === "blocked") return "중단";
    if (requestPhase === "sending") return "요청 전송";
    if (requestPhase === "accepted") return "요청 승인";
    if (requestPhase === "queued") return "큐 적재";
    if (requestPhase === "completed") return "실행 추적";
    if (requestPhase === "failed") return "요청 실패";
    if (dbPlatforms.length === 0) return "대기";
    return "대기";
  })();
  const queueStateClass =
    queueDepth > 0 ? getStatusToneBadgeClass("warn") : getStatusToneBadgeClass("ok");
  const trackedRuns = useMemo(() => {
    if (requestedTargets.length === 0) return [];
    const requestedNames = new Set(requestedTargets.map((target) => target.name));
    return runs.filter((run) => run.platform?.name && requestedNames.has(run.platform.name));
  }, [requestedTargets, runs]);
  const trackedSummary = useMemo(() => {
    if (requestedTargets.length === 0) {
      return {
        total: 0,
        running: 0,
        queued: 0,
        success: 0,
        failed: 0,
        pending: 0,
      };
    }

    const latestByPlatform = new Map<string, IngestRun>();
    for (const run of trackedRuns) {
      if (!run.platform?.name) continue;
      if (!latestByPlatform.has(run.platform.name)) {
        latestByPlatform.set(run.platform.name, run);
      }
    }

    const latestRuns = Array.from(latestByPlatform.values());
    return {
      total: requestedTargets.length,
      running: latestRuns.filter((run) => run.status === "RUNNING").length,
      queued: latestRuns.filter((run) => run.status === "QUEUED" || run.status === "PENDING").length,
      success: latestRuns.filter((run) => run.status === "SUCCESS").length,
      failed: latestRuns.filter((run) => run.status === "FAILED").length,
      pending: requestedTargets.length - latestRuns.length,
    };
  }, [requestedTargets, trackedRuns]);

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
  const nextOpsActions = [
    {
      title: "전체 플랫폼 수집",
      detail: "지금 바로 전체 수집 요청을 보냅니다.",
      icon: PlayCircle,
      disabled: ingestStatus === "running" || requiresAdminConfig || dbPlatforms.length === 0 || !isPasswordStored,
      onClick: () => {
        setSelectedPlatformId("all");
        void triggerIngest();
      },
    },
    {
      title: "운영 경보 확인",
      detail: alertsCount > 0 ? `현재 알림 ${alertsCount}건을 바로 확인합니다.` : "현재 경보는 적지만 바로 점검 화면으로 이동합니다.",
      href: "/system",
      icon: Wrench,
    },
    {
      title: "상태 재점검",
      detail: "수집 이력과 상태 지표를 즉시 다시 불러옵니다.",
      icon: TimerReset,
      onClick: () => {
        void checkHealth();
        void fetchRuns();
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] dark:bg-[#020617] text-slate-200 pb-20">
      <main className="max-w-[1780px] mx-auto p-5 md:p-6 space-y-5">
        <section className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">운영 대시보드</p>
          <h1 className="text-2xl font-black text-white mt-2">관리자 콘솔</h1>
          <p className="text-sm text-slate-400 mt-2">수집, 플랫폼 상태, 분석, 알림 이력을 한 화면에서 운영합니다.</p>
          <button
            onClick={() => void checkHealth()}
            aria-label="운영 상태를 다시 점검"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-black border border-slate-700/50 hover:bg-slate-700 transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            disabled={healthStatus === "checking"}
          >
            운영 상태 재점검
          </button>
        </section>

        {!isPasswordStored && (
            <section className="rounded-2xl bg-indigo-950/30 border border-indigo-500/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 blur-[50px] pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white">관리자 인증이 필요합니다</h2>
                        <p className="text-xs text-indigo-300/80">제어판 및 설정 기능을 사용하려면 ADMIN_PASSWORD를 입력하세요.</p>
                    </div>
                </div>
                <form onSubmit={handlePasswordSubmit} className="flex gap-2 w-full md:w-auto relative z-10">
                    <input 
                        type="password"
                        placeholder="Admin Password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-2 text-sm font-black transition-all">
                        인증
                    </button>
                </form>
            </section>
        )}


        {errorMessage ? (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-200 px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>{errorMessage}</span>
            <button
              onClick={() => { void checkHealth(); void fetchRuns(); }}
              className="shrink-0 px-3 py-1 rounded-lg border border-rose-400/40 text-rose-200 hover:bg-rose-500/10 text-xs font-bold focus-visible:ring-2 focus-visible:ring-rose-400"
            >
              재시도
            </button>
          </div>
        ) : null}
        {requiresAdminConfig ? (
          <section className="rounded-lg border border-rose-400/50 bg-rose-500/10 px-4 py-4 text-rose-200 text-sm space-y-3">
            <p className="font-black text-rose-100">관리자 API 인증 설정 필요</p>
            <p className="text-rose-200/90 leading-relaxed">
              관리자 API 요청이 503으로 내려옵니다. 배포 환경 변수에 아래 값을 등록하고 재배포하면 즉시 해소됩니다.
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

        <section id="overview" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
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

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {nextOpsActions.map((action) => {
            const Icon = action.icon;
            if (action.href) {
              return (
                <a
                  key={action.title}
                  href={action.href}
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">즉시 실행</p>
                    <Icon className="w-4 h-4 text-blue-300" />
                  </div>
                  <h2 className="mt-3 text-lg font-black text-white">{action.title}</h2>
                  <p className="mt-2 text-sm text-slate-300">{action.detail}</p>
                </a>
              );
            }

            return (
              <button
                key={action.title}
                type="button"
                onClick={action.onClick}
                disabled={action.disabled}
                className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 text-left hover:bg-slate-800/70 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">즉시 실행</p>
                  <Icon className="w-4 h-4 text-blue-300" />
                </div>
                <h2 className="mt-3 text-lg font-black text-white">{action.title}</h2>
                <p className="mt-2 text-sm text-slate-300">{action.detail}</p>
              </button>
            );
          })}
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
                aria-label="수집 이력 새로고침"
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <RefreshCcw className={`w-4 h-4 ${isLoadingSnapshot ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => setSelectedPlatformId("all")}
                className={`px-3 py-2 text-xs rounded-xl border font-black ${selectedPlatformId === "all"
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
                  className={`px-3 py-2 text-xs rounded-xl border font-black ${selectedPlatformId === platform.id
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
                <p className="text-white font-black">{getStatusToneLabel(healthStatus)}</p>
              </div>
              <div className="rounded-xl border border-slate-800 p-3">
                <p className="text-slate-500 mb-1">실시간 실행</p>
                <p className="text-white font-black">{runningRuns} / {runs.length}</p>
              </div>
              <div className="rounded-xl border border-slate-800 p-3">
                <p className="text-slate-500 mb-1">큐 적재</p>
                <p className="text-white font-black">
                  {queueDepth}건 (대기 {pendingRuns}건)
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 p-3">
                <p className="text-slate-500 mb-1">요청 단계</p>
                <p className="text-white font-black">{requestStateLabel}</p>
              </div>
            </div>
            {lastIngestMessage ? (
              <div className="mb-4 rounded-xl border border-blue-500/40 bg-blue-950/30 p-3 text-xs text-blue-200 flex gap-2 items-start">
                <TerminalSquare className="w-3.5 h-3.5 mt-0.5" />
                <p className="leading-relaxed">{lastIngestMessage}</p>
              </div>
            ) : null}
            {requestedTargets.length > 0 ? (
              <div className="mb-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">요청 추적</p>
                    <p className="mt-1 text-sm font-black text-white">방금 요청한 플랫폼 {trackedSummary.total}개</p>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[11px] font-black ${queueStateClass}`}>
                    {requestStateLabel}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 sm:grid-cols-5">
                  <div className="rounded-lg border border-slate-800 px-3 py-2">대기 {trackedSummary.pending}</div>
                  <div className="rounded-lg border border-slate-800 px-3 py-2">큐 {trackedSummary.queued}</div>
                  <div className="rounded-lg border border-slate-800 px-3 py-2">실행 {trackedSummary.running}</div>
                  <div className="rounded-lg border border-slate-800 px-3 py-2">성공 {trackedSummary.success}</div>
                  <div className="rounded-lg border border-slate-800 px-3 py-2">실패 {trackedSummary.failed}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {requestedTargets.map((target) => {
                    const run = trackedRuns.find((item) => item.platform?.name === target.name);
                    const status = run?.status ?? "PENDING";
                    const tone =
                      status === "SUCCESS"
                        ? getStatusToneBadgeClass("ok")
                        : status === "FAILED"
                          ? getStatusToneBadgeClass("critical")
                          : getStatusToneBadgeClass("warn");
                    return (
                      <span key={target.id} className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${tone}`}>
                        {target.name} {runStatusLabel(status)}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <button
              onClick={triggerIngest}
              disabled={ingestStatus === "running" || requiresAdminConfig || dbPlatforms.length === 0 || !isPasswordStored}
              aria-label="선택된 플랫폼 수집 실행"
              className={`w-full py-4 rounded-2xl border border-slate-700 font-black text-sm tracking-wide ${ingestStatus === "running"
                  ? "bg-slate-800 text-slate-500"
                  : requiresAdminConfig
                    ? "bg-slate-800 text-rose-300 cursor-not-allowed"
                    : dbPlatforms.length === 0
                      ? "bg-slate-800 text-amber-300 cursor-not-allowed"
                      : "bg-white text-slate-900 hover:bg-blue-500 hover:text-white transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                }`}
            >
              {requiresAdminConfig
                ? "환경 설정 필요"
                : ingestStatus === "running"
                  ? "수집 실행 중..."
                  : dbPlatforms.length === 0
                    ? "플랫폼이 없습니다"
                    : !isPasswordStored
                    ? "비밀번호 인증 필요"
                    : "수집 실행"}
            </button>
            {dbPlatforms.length === 0 ? (
              <p className="text-amber-300 text-xs mt-2 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                활성화된 플랫폼이 없습니다. 플랫폼 관리에서 사이트를 먼저 등록해 주세요.
              </p>
            ) : null}

            {isPasswordStored && (
              <div
                className="mt-5 border border-slate-800 rounded-2xl p-4 bg-black/40 h-56 overflow-y-auto"
                ref={logContainerRef}
              >
                {isLoading ? <p className="text-slate-500">이전 로그를 불러오는 중입니다.</p> : null}
                {logs.map((log, idx) => (
                  <p key={`log-${idx}`} className="font-mono text-xs text-emerald-300/90 mb-1">
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
        
        <section id="history" className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
               <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">최근 수집 내역</h2>
              <p className="text-xs text-slate-400">최근 실행된 30개의 수집 데이터 및 상세 로그를 확인합니다.</p>
            </div>
          </div>
          {isPasswordStored ? (
             <ScraperStatusTable initialRuns={runs} />
          ) : (
            <div className="p-8 text-center text-slate-600 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
               인증 후 수집 내역을 확인할 수 있습니다.
            </div>
          )}
        </section>

        <section id="settings" className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">시스템 설정 및 서버 제어</h2>
                <p className="text-xs text-slate-400 uppercase tracking-widest">System Configuration & Server Control</p>
              </div>
            </div>
          </div>
          {isPasswordStored ? (
             <SystemSettingsManager />
          ) : (
            <div className="p-8 text-center text-slate-600 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
               인증 후 시스템 설정을 변경할 수 있습니다.
            </div>
          )}
        </section>

        <section id="campaigns" className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">캠페인 데이터 관리</h2>
              <p className="text-xs text-slate-400">전체 캠페인 조회, stale/만료 필터, 개별 삭제 및 일괄 정리</p>
            </div>
          </div>
          {isPasswordStored ? (
            <CampaignManager adminPassword={adminPassword} />
          ) : (
            <div className="p-8 text-center text-slate-600 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
              인증 후 캠페인 데이터를 관리할 수 있습니다.
            </div>
          )}
        </section>

        <section id="reviewers" className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
          <h2 className="text-lg font-black text-white mb-4">체험단 목록 관리</h2>
          <ReviewerManager adminPassword={adminPassword} />
        </section>
      </main>
    </div>
  );
}
