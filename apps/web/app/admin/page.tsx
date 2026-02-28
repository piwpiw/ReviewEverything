"use client"

import { useState, useEffect } from "react"
import ScraperStatusTable from "@/components/ScraperStatusTable";
import CsvUploadFallback from "@/components/CsvUploadFallback";

const PLATFORM_LIST = [
    { id: 1, name: "Revu" },
    { id: 2, name: "Reviewnote" },
    { id: 3, name: "DinnerQueen" },
    { id: 4, name: "ReviewPlace" },
    { id: 5, name: "Seouloppa" },
    { id: 6, name: "MrBlog" },
    { id: 7, name: "GangnamFood" },
];

type IngestStatus = 'idle' | 'triggering' | 'success' | 'error';

export default function AdminDashboard() {
    const [runs, setRuns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlatformId, setSelectedPlatformId] = useState<number | 'all'>('all');
    const [ingestStatus, setIngestStatus] = useState<IngestStatus>('idle');
    const [ingestMessage, setIngestMessage] = useState('');
    const [healthStatus, setHealthStatus] = useState<'ok' | 'error' | 'checking'>('checking');
    const [totalCampaigns, setTotalCampaigns] = useState<number | null>(null);

    // ── Fetch Runs ────────────────────────────────────────────────────────────
    const fetchRuns = async () => {
        try {
            const res = await fetch('/api/admin/runs?limit=30');
            if (!res.ok) throw new Error('Runs API failed');
            const data = await res.json();
            if (data.data) setRuns(data.data);
        } catch (e) {
            console.error("Failed to fetch runs", e);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Health Check ──────────────────────────────────────────────────────────
    const checkHealth = async () => {
        try {
            const [healthRes, campRes] = await Promise.all([
                fetch('/api/health'),
                fetch('/api/campaigns?limit=1'),
            ]);

            const healthData = await healthRes.json();

            if (healthRes.ok && healthData?.db === 'ok') {
                setHealthStatus('ok');
            } else {
                setHealthStatus('error');
            }

            if (campRes.ok) {
                const campData = await campRes.json();
                setTotalCampaigns(campData?.meta?.total ?? 0);
            } else {
                setTotalCampaigns(0);
            }
        } catch {
            setHealthStatus('error');
        }
    };

    // ── Trigger Ingest ────────────────────────────────────────────────────────
    const triggerIngest = async () => {
        if (ingestStatus === 'triggering') return;
        setIngestStatus('triggering');
        setIngestMessage('');

        const platformsToIngest = selectedPlatformId === 'all'
            ? PLATFORM_LIST
            : PLATFORM_LIST.filter(p => p.id === selectedPlatformId);

        try {
            const results = await Promise.all(
                platformsToIngest.map(p =>
                    fetch('/api/admin/ingest', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ platform_id: p.id })
                    }).then(r => r.ok ? `✓ ${p.name}` : `✗ ${p.name}`)
                )
            );
            setIngestStatus('success');
            setIngestMessage(results.join('  ·  '));
            // Poll for updated status after 2s
            setTimeout(fetchRuns, 2000);
            setTimeout(fetchRuns, 6000);
        } catch (e: any) {
            setIngestStatus('error');
            setIngestMessage(e?.message || '알 수 없는 오류가 발생했습니다.');
        } finally {
            setTimeout(() => setIngestStatus('idle'), 8000);
        }
    };

    useEffect(() => {
        fetchRuns();
        checkHealth();
        const runsTimer = setInterval(fetchRuns, 10000);
        const healthTimer = setInterval(checkHealth, 30000);
        return () => {
            clearInterval(runsTimer);
            clearInterval(healthTimer);
        };
    }, []);

    // ── Stats ─────────────────────────────────────────────────────────────────
    const successRuns = runs.filter(r => r.status === 'SUCCESS').length;
    const failedRuns = runs.filter(r => r.status === 'FAILED').length;
    const runningRuns = runs.filter(r => r.status === 'RUNNING').length;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-6 pb-32">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        수집 관제 센터
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${healthStatus === 'ok' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${healthStatus === 'ok' ? 'bg-green-500' : healthStatus === 'checking' ? 'bg-amber-400' : 'bg-red-500'}`}></span>
                        </span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium">7개 플랫폼 데이터 파이프라인을 관제하고 수동으로 수집을 제어합니다.</p>
                </div>
                <a href="/" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl hover:border-blue-300 bg-white shadow-sm">
                    ← 홈으로 이동
                </a>
            </div>

            {/* ── Stats Bar ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    {
                        label: '헬스 상태',
                        value: healthStatus === 'ok' ? 'ONLINE' : healthStatus === 'checking' ? '확인 중' : 'OFFLINE',
                        color: healthStatus === 'ok' ? 'text-green-600' : healthStatus === 'checking' ? 'text-amber-500' : 'text-red-600',
                        bg: healthStatus === 'ok' ? 'bg-green-50' : healthStatus === 'checking' ? 'bg-amber-50' : 'bg-red-50',
                    },
                    {
                        label: '총 캠페인',
                        value: totalCampaigns !== null ? `${totalCampaigns.toLocaleString()}건` : '—',
                        color: 'text-blue-600',
                        bg: 'bg-blue-50',
                    },
                    {
                        label: '성공 실행',
                        value: `${successRuns}건`,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                    },
                    {
                        label: '실패/수집중',
                        value: `${failedRuns}건 / ${runningRuns}건`,
                        color: failedRuns > 0 ? 'text-red-600' : 'text-slate-600',
                        bg: failedRuns > 0 ? 'bg-red-50' : 'bg-slate-50',
                    },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 border border-white`}>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</div>
                        <div className={`text-xl font-black ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Ingest Control Panel ──────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
                <div>
                    <h2 className="text-lg font-black text-slate-900">수동 수집 트리거</h2>
                    <p className="text-sm text-slate-500 mt-0.5">플랫폼을 선택 후 즉시 크롤링을 시작합니다. 수집은 백그라운드에서 진행됩니다.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setSelectedPlatformId('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${selectedPlatformId === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                    >
                        전체 플랫폼
                    </button>
                    {PLATFORM_LIST.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedPlatformId(p.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${selectedPlatformId === p.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                        onClick={triggerIngest}
                        disabled={ingestStatus === 'triggering'}
                        className={`px-8 py-3.5 rounded-xl font-black text-sm transition-all shadow-sm ${ingestStatus === 'triggering'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-md'
                            }`}
                    >
                        {ingestStatus === 'triggering' ? '⏳ 수집 요청 중...' : `🚀 ${selectedPlatformId === 'all' ? '전체' : PLATFORM_LIST.find(p => p.id === selectedPlatformId)?.name} 수집 시작`}
                    </button>
                    {ingestMessage && (
                        <div className={`text-xs font-mono px-4 py-2 rounded-xl ${ingestStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {ingestStatus === 'success' ? '✓ 트리거 완료: ' : '✗ 오류: '}{ingestMessage}
                        </div>
                    )}
                </div>
            </div>

            {/* ── CSV Fallback ──────────────────────────────────────────── */}
            <CsvUploadFallback />

            {/* ── Run Logs ─────────────────────────────────────────────── */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200 font-black text-sm text-slate-800 bg-slate-50 flex items-center justify-between">
                    <span>크롤링 실행 이력 (Live · 10초마다 자동 갱신)</span>
                    <button
                        onClick={fetchRuns}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                        ↻ 지금 새로고침
                    </button>
                </div>
                {isLoading ? (
                    <div className="p-12 text-center text-slate-400 font-medium animate-pulse">실행 이력 로드 중...</div>
                ) : (
                    <ScraperStatusTable initialRuns={runs} />
                )}
            </div>
        </div>
    )
}
