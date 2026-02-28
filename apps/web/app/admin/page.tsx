"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Activity,
    Database,
    RefreshCcw,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowUpRight,
    Terminal,
    BarChart3,
    Layers,
    ExternalLink
} from "lucide-react";
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

    const checkHealth = async () => {
        try {
            const [healthRes, campRes] = await Promise.all([
                fetch('/api/health'),
                fetch('/api/campaigns?limit=1'),
            ]);
            const healthData = await healthRes.json();
            setHealthStatus(healthRes.ok && healthData?.db === 'ok' ? 'ok' : 'error');
            if (campRes.ok) {
                const campData = await campRes.json();
                setTotalCampaigns(campData?.meta?.total ?? 0);
            }
        } catch {
            setHealthStatus('error');
        }
    };

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
                    }).then(r => r.ok ? `Queued ${p.name}` : `Failed ${p.name}`)
                )
            );
            setIngestStatus('success');
            setIngestMessage(results.join(' | '));
            setTimeout(fetchRuns, 2000);
        } catch (e: any) {
            setIngestStatus('error');
            setIngestMessage(e?.message || 'Unexpected ingest error.');
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

    const successRuns = runs.filter(r => r.status === 'SUCCESS').length;
    const failedRuns = runs.filter(r => r.status === 'FAILED').length;
    const lastRun = runs[0];

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans selection:bg-blue-500/30 pb-40">
            {/* Top Navigation */}
            <div className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-lg font-black text-white tracking-tight">SYSTEM CONTROL CENTER</h1>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${healthStatus === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${healthStatus === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            {healthStatus === 'ok' ? 'LIVE' : 'DOWN'}
                        </div>
                    </div>
                    <Link href="/" className="text-xs font-bold hover:text-white transition-colors flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                        서비스 홈
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-6 flex flex-col gap-6 mt-4">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-xl group hover:border-blue-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><Database className="w-5 h-5" /></div>
                            <span className="text-[10px] font-black tracking-widest text-slate-500">DATABASE</span>
                        </div>
                        <div className="text-3xl font-black text-white">{totalCampaigns?.toLocaleString() ?? '---'}</div>
                        <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">Active Campaigns</div>
                    </div>
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-xl group hover:border-emerald-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><CheckCircle2 className="w-5 h-5" /></div>
                            <span className="text-[10px] font-black tracking-widest text-slate-500">RESILIENCE</span>
                        </div>
                        <div className="text-3xl font-black text-white">{successRuns}</div>
                        <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">Healthy Ingestions</div>
                    </div>
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-xl group hover:border-rose-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500"><AlertCircle className="w-5 h-5" /></div>
                            <span className="text-[10px] font-black tracking-widest text-slate-500">INCIDENTS</span>
                        </div>
                        <div className="text-3xl font-black text-white">{failedRuns}</div>
                        <div className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">Recent Failures</div>
                    </div>
                    <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-xl group hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500"><Clock className="w-5 h-5" /></div>
                            <span className="text-[10px] font-black tracking-widest text-slate-500">LAST SYNC</span>
                        </div>
                        <div className="text-xl font-bold text-white truncate">{lastRun ? new Date(lastRun.start_time).toLocaleTimeString() : 'N/A'}</div>
                        <div className="text-xs font-bold text-slate-500 mt-2 uppercase tracking-tight">{lastRun?.platform?.name ?? 'System Idle'}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Control Panel */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-2xl p-8">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                                        <Terminal className="w-5 h-5 text-blue-500" />
                                        수집 작업 제어 데스크
                                    </h2>
                                    <p className="text-xs text-slate-500 font-bold mt-1 tracking-tight">선택한 플랫폼의 데이터를 즉시 수집하고 수동으로 동기화합니다.</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={fetchRuns}
                                        className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors border border-slate-700"
                                    >
                                        <RefreshCcw className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-10">
                                <button
                                    onClick={() => setSelectedPlatformId('all')}
                                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${selectedPlatformId === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                                >
                                    전체 플랫폼
                                </button>
                                {PLATFORM_LIST.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPlatformId(p.id)}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border ${selectedPlatformId === p.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                                    >
                                        {p.name}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col gap-6 p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                                            <Layers className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Selected Target</div>
                                            <div className="text-lg font-black text-white">{selectedPlatformId === 'all' ? 'BATCH: ALL PLATFORMS' : PLATFORM_LIST.find(p => p.id === selectedPlatformId)?.name}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={triggerIngest}
                                        disabled={ingestStatus === 'triggering'}
                                        className={`px-10 py-5 rounded-2xl font-black text-sm tracking-widest transition-all ${ingestStatus === 'triggering'
                                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                            : 'bg-white text-slate-900 hover:bg-blue-500 hover:text-white transform active:scale-95 shadow-2xl'
                                            }`}
                                    >
                                        {ingestStatus === 'triggering' ? 'COMMAND EXECUTING...' : 'RUN INGESTION JOB'}
                                    </button>
                                </div>

                                {ingestMessage && (
                                    <div className="mt-4 p-4 rounded-xl bg-black border border-slate-800 font-mono text-[11px] text-blue-400 leading-relaxed max-h-32 overflow-y-auto w-full">
                                        <div className="flex items-center gap-2 mb-2 text-slate-600">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            $ systemctl start-ingest --id={selectedPlatformId}
                                        </div>
                                        {ingestMessage}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Runs Table */}
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
                                <h3 className="text-sm font-black text-white flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                                    최근 수집 로그 (Live Updates)
                                </h3>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-time Ingest Pipeline</div>
                            </div>
                            <ScraperStatusTable initialRuns={runs} />
                        </div>
                    </div>

                    {/* Sidebar / Tools */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-8 shadow-xl">
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-amber-500" />
                                비상 데이터 복구
                            </h3>
                            <CsvUploadFallback />
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 shadow-2xl text-white">
                            <h3 className="text-lg font-black mb-4">Pro Scraper Insight</h3>
                            <p className="text-sm text-blue-100/80 mb-6 leading-relaxed">수집 효율을 극대화하기 위해 재시도 로직과 지연 방지 전략이 가동 중입니다. IP 차단 감지 시 자동으로 수집 간격이 조절됩니다.</p>
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2">
                                    <span className="text-blue-200 uppercase">Concurrency</span>
                                    <span>MAX (Promise.allSettled)</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold border-b border-white/10 pb-2">
                                    <span className="text-blue-200 uppercase">Retry Logic</span>
                                    <span>Exponential Backoff</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-blue-200 uppercase">Agent Mode</span>
                                    <span>Active / Verificated</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
