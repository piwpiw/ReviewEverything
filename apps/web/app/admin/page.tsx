"use client";

import { useState, useEffect, useRef } from "react";
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
    ExternalLink,
    ShieldAlert,
    Cpu,
    Globe,
    Zap
} from "lucide-react";
import ScraperStatusTable from "@/components/ScraperStatusTable";
import CsvUploadFallback from "@/components/CsvUploadFallback";
import { motion, AnimatePresence } from "framer-motion";

const PLATFORM_LIST = [
    { id: 1, name: "Revu", color: "#3b82f6" },
    { id: 2, name: "Reviewnote", color: "#8b5cf6" },
    { id: 3, name: "DinnerQueen", color: "#f59e0b" },
    { id: 4, name: "ReviewPlace", color: "#10b981" },
    { id: 5, name: "Seouloppa", color: "#ef4444" },
    { id: 6, name: "MrBlog", color: "#6366f1" },
    { id: 7, name: "GangnamFood", color: "#f97316" },
];

type IngestStatus = 'idle' | 'triggering' | 'success' | 'error';

export default function AdminDashboard() {
    const [runs, setRuns] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPlatformId, setSelectedPlatformId] = useState<number | 'all'>('all');
    const [ingestStatus, setIngestStatus] = useState<IngestStatus>('idle');
    const [logs, setLogs] = useState<string[]>(["[SYSTEM] Dashboard initialized.", "[READY] Waiting for user command."]);
    const [healthStatus, setHealthStatus] = useState<'ok' | 'error' | 'checking'>('checking');
    const [qualityStatus, setQualityStatus] = useState<'ok' | 'warn' | 'critical' | 'checking'>('checking');
    const [alertsCount, setAlertsCount] = useState<number>(0);
    const [totalCampaigns, setTotalCampaigns] = useState<number | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-49), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const fetchRuns = async () => {
        try {
            const res = await fetch('/api/admin/runs?limit=30');
            if (!res.ok) throw new Error('Runs API failed');
            const data = await res.json();
            if (data.data) {
                const newRuns = data.data;
                // Detect changes to log
                if (newRuns.length > 0 && runs.length > 0 && newRuns[0].id !== runs[0].id) {
                    addLog(`New ingest run detected: ${newRuns[0].platform?.name} - ${newRuns[0].status}`);
                }
                setRuns(newRuns);
            }
        } catch (e) {
            console.error("Failed to fetch runs", e);
        } finally {
            setIsLoading(false);
        }
    };

    const checkHealth = async () => {
        try {
            const [healthRes, campRes, qualityRes] = await Promise.all([
                fetch('/api/health'),
                fetch('/api/campaigns?limit=1'),
                fetch('/api/admin/quality'),
            ]);
            const healthData = await healthRes.json();
            setHealthStatus(healthRes.ok && healthData?.db === 'ok' ? 'ok' : 'error');
            if (campRes.ok) {
                const campData = await campRes.json();
                setTotalCampaigns(campData?.meta?.total ?? 0);
            }
            if (qualityRes.ok) {
                const qualityData = await qualityRes.json();
                setQualityStatus(qualityData?.status || 'warn');
                setAlertsCount(qualityData?.alerts_count || 0);
            } else {
                setQualityStatus('warn');
            }
        } catch {
            setHealthStatus('error');
            setQualityStatus('critical');
        }
    };

    const triggerIngest = async () => {
        if (ingestStatus === 'triggering') return;
        setIngestStatus('triggering');
        addLog(`Triggering ingestion for ${selectedPlatformId === 'all' ? 'ALL platforms' : 'Platform ID ' + selectedPlatformId}`);

        const platformsToIngest = selectedPlatformId === 'all'
            ? PLATFORM_LIST
            : PLATFORM_LIST.filter(p => p.id === selectedPlatformId);

        try {
            for (const p of platformsToIngest) {
                addLog(`Inbound Request -> [${p.name}] starting...`);
                const res = await fetch('/api/admin/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platform_id: p.id })
                });
                if (res.ok) {
                    addLog(`[${p.name}] Pipeline accepted. Job queued successfully.`);
                } else {
                    addLog(`[${p.name}] API responded with error. Check server logs.`);
                }
            }
            setIngestStatus('success');
            setTimeout(fetchRuns, 2000);
        } catch (e: any) {
            setIngestStatus('error');
            addLog(`CRITICAL ERROR: ${e?.message}`);
        } finally {
            setTimeout(() => setIngestStatus('idle'), 5000);
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

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const successRuns = runs.filter(r => r.status === 'SUCCESS').length;
    const failedRuns = runs.filter(r => r.status === 'FAILED').length;
    const lastRun = runs[0];

    return (
        <div className="min-h-screen bg-[#020617] text-slate-400 font-sans selection:bg-blue-500/30 pb-40">
            {/* Real-time Status Bar (Premium) */}
            <div className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-[100]">
                <div className="max-w-[1700px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Cpu className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Center 01</span>
                                <h1 className="text-sm font-black text-white leading-none">INGESTION_CONTROLLER_V2</h1>
                            </div>
                        </div>
                        <div className="h-8 w-px bg-slate-800" />
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${healthStatus === 'ok' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-[10px] font-black uppercase">DB_UPLINK</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${qualityStatus === 'ok' ? 'bg-emerald-500' : qualityStatus === 'warn' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                <span className="text-[10px] font-black uppercase">OPS_{qualityStatus.toUpperCase()}</span>
                                <span className="text-[10px] font-black text-slate-500">ALERTS {alertsCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[10px] font-black uppercase">{PLATFORM_LIST.length} Platforms Active</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/system" className="px-5 py-2 rounded-xl bg-blue-600 text-white text-[10px] font-black hover:bg-blue-500 transition-all border border-blue-500/50 shadow-inner">
                            OPEN SYSTEM OPS
                        </Link>
                        <Link href="/" className="px-5 py-2 rounded-xl bg-slate-800 text-white text-[10px] font-black hover:bg-slate-700 transition-all border border-slate-700/50 shadow-inner">
                            EXIT TO PUBLIC HOME ??                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-[1700px] mx-auto p-6 flex flex-col gap-6 mt-4">
                {/* HUD Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "INDEXED_RECORDS", val: totalCampaigns?.toLocaleString() ?? 'FETCHING...', icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
                        { label: "SUCCESS_PIPELINE", val: successRuns, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
                        { label: "SYSTEM_ERRORS", val: failedRuns, icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-500/10" },
                        { label: "LAST_SYNC_EPOCH", val: lastRun ? new Date(lastRun.start_time).toLocaleTimeString() : 'IDLE', icon: zapIcon, color: "text-amber-500", bg: "bg-amber-500/10" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/80 shadow-2xl relative overflow-hidden group"
                        >
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-[30px] group-hover:bg-white/10 transition-all" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-2.5 ${stat.bg} ${stat.color} rounded-2xl`}><stat.icon className="w-5 h-5" /></div>
                                <span className="text-[9px] font-black tracking-[0.2em] text-slate-500">DATA_NODE_{i + 1}</span>
                            </div>
                            <div className="text-3xl font-black text-white mb-1">{stat.val}</div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Command Console */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800/80 shadow-2xl p-8">
                            <div className="flex justify-between items-center mb-10">
                                <div className="flex flex-col gap-1">
                                    <h2 className="text-xl font-black text-white flex items-center gap-3 italic">
                                        <Terminal className="w-5 h-5 text-blue-500" />
                                        COMMAND_DESK_v2
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Execute manual ingestion commands across all indices.</p>
                                </div>
                                <button
                                    onClick={fetchRuns}
                                    className="p-3 bg-slate-800/50 rounded-2xl text-slate-400 hover:text-white transition-all border border-slate-700/50 active:rotate-180 duration-500"
                                >
                                    <RefreshCcw className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 mb-10">
                                <button
                                    onClick={() => setSelectedPlatformId('all')}
                                    className={`px-3 py-3 rounded-2xl text-[10px] font-black transition-all border ${selectedPlatformId === 'all' ? 'bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-500/40' : 'bg-slate-800/50 text-slate-500 border-slate-700/50 hover:border-slate-500'}`}
                                >
                                    ALL_MODES
                                </button>
                                {PLATFORM_LIST.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPlatformId(p.id)}
                                        className={`px-3 py-3 rounded-2xl text-[10px] font-black transition-all border ${selectedPlatformId === p.id ? 'bg-blue-600 text-white border-blue-600 shadow-2xl shadow-blue-500/40' : 'bg-slate-800/50 text-slate-500 border-slate-700/50 hover:border-slate-500'}`}
                                        style={{ borderColor: selectedPlatformId === p.id ? p.color : undefined }}
                                    >
                                        {p.name.toUpperCase()}
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
                                            {ingestStatus === 'triggering' && (
                                                <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-[2rem] animate-spin" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Cluster</div>
                                            <div className="text-3xl font-black text-white tracking-tighter">
                                                {selectedPlatformId === 'all' ? 'ROOT_PIPELINE' : PLATFORM_LIST.find(p => p.id === selectedPlatformId)?.name.toUpperCase()}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[9px] font-black text-emerald-500/80 uppercase">Awaiting instruction</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={triggerIngest}
                                        disabled={ingestStatus === 'triggering'}
                                        className={`group relative overflow-hidden px-12 py-7 rounded-[2rem] font-black text-xs tracking-[0.2em] transition-all ${ingestStatus === 'triggering'
                                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                            : 'bg-white text-slate-900 hover:bg-blue-600 hover:text-white transform active:scale-95 shadow-[0_20px_40px_-15px_rgba(255,255,255,0.2)]'
                                            }`}
                                    >
                                        <span className="relative z-10">{ingestStatus === 'triggering' ? 'EXECUTING...' : 'INITIATE_INGESTION'}</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>

                                {/* Live Terminal (100x Upgrade) */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase flex items-center gap-2">
                                            <Terminal className="w-3 h-3 text-emerald-500" />
                                            IO_STREAM_TERMINAL
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-600">CONNECTED: TCP/IP SSL</span>
                                    </div>
                                    <div
                                        ref={logContainerRef}
                                        className="h-44 bg-black/80 rounded-[2rem] p-6 font-mono text-[11px] text-emerald-500/90 leading-relaxed overflow-y-auto border border-slate-800/60 shadow-inner custom-scrollbar"
                                    >
                                        {logs.map((log, i) => (
                                            <div key={i} className="mb-1 opacity-80 hover:opacity-100 transition-opacity">
                                                <span className="text-slate-600 mr-2">root@system:~$</span>
                                                {log}
                                            </div>
                                        ))}
                                        {ingestStatus === 'triggering' && (
                                            <div className="animate-pulse">_</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pipeline History */}
                        <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800/80 shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-slate-800/60 flex justify-between items-center bg-slate-900/30">
                                <h3 className="text-sm font-black text-white flex items-center gap-3">
                                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                                    PIPELINE_EXECUTION_HISTORY
                                </h3>
                                <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-3 py-1 bg-black/40 rounded-full border border-slate-800">Cluster 01 Updates</div>
                            </div>
                            <ScraperStatusTable initialRuns={runs} />
                        </div>
                    </div>

                    {/* Meta Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800/80 p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3 relative z-10 italic">
                                <ShieldAlert className="w-5 h-5 text-amber-500" />
                                FAILSAFE_CONTROLS
                            </h3>
                            <CsvUploadFallback />
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden group">
                            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-[2s]" />
                            <h3 className="text-xl font-black mb-4 flex items-center gap-3">
                                <Zap className="w-6 h-6 text-amber-300" />
                                HYPER_SCRAPER_AI
                            </h3>
                            <p className="text-sm text-blue-100/70 mb-8 leading-relaxed font-bold">The system is currently operating in High-Performance mode with intelligent IP rotation and dynamic retry backoff.</p>
                            <div className="space-y-5 relative z-10">
                                {[
                                    { k: "Concurrent Streams", v: "15 Workers" },
                                    { k: "Encoding Standard", v: "Strict UTF-8 (No BOM)" },
                                    { k: "Bypass Protocol", v: "Rotating User-Agents" },
                                    { k: "Edge Protection", v: "Rate-Limit Adaptive" },
                                ].map(item => (
                                    <div key={item.k} className="flex justify-between text-[11px] font-black border-b border-white/10 pb-3">
                                        <span className="text-blue-200 uppercase tracking-widest">{item.k}</span>
                                        <span className="text-white">{item.v}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all">
                                ACCESS_LOW_LEVEL_LOGS
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function zapIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.71V21l5.97-5.97C12.19 13.9 14.5 12 17 12a5 5 0 0 0 0-10c-2.5 0-4.81 1.9-7.03 4.03L4 12.02V8" /><path d="M12 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Z" /><path d="M4 14.71 12 12" /></svg>
    )
}

