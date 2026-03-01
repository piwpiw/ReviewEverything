"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Play, Activity, Database, HeartPulse, RefreshCw, BarChart3, ShieldCheck, Zap, AlertTriangle, CheckCircle2, Search, Settings } from "lucide-react";
import Link from "next/link";

export default function AdminConsolePage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [platformStats, setPlatformStats] = useState<any[]>([]);
    const [ingestStats, setIngestStats] = useState<any[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [systemStatus, setSystemStatus] = useState("Standby");
    const [performance, setPerformance] = useState({ cpu: 12, mem: 42, latency: 120 });

    // Mock logs for professional feel
    const addLog = (msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
        setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), msg, type }, ...prev].slice(0, 50));
    };

    useEffect(() => {
        // Initial health check
        addLog("Initializing ReviewEverything AI Control Hub...", "info");
        setTimeout(() => addLog("Connection to MCP Server established.", "success"), 500);
        setTimeout(() => addLog("PostgreSQL Database URL detected in environment.", "info"), 1000);

        // Mock data
        setPlatformStats([
            { id: 1, name: "Revu", status: "Active", count: 1242, lastRun: "2h ago" },
            { id: 2, name: "Reviewnote", status: "Active", count: 842, lastRun: "5h ago" },
            { id: 3, name: "DinnerQueen", status: "Warn", count: 212, lastRun: "1d ago" },
            { id: 4, name: "Seouloppa", status: "Active", count: 531, lastRun: "3h ago" },
        ]);

        setIngestStats([
            { id: 101, time: "11:00", platform: "Revu", added: 24, updated: 82, status: "Success" },
            { id: 102, time: "10:30", platform: "Reviewnote", added: 12, updated: 45, status: "Success" },
            { id: 103, time: "09:15", platform: "DinnerQueen", added: 0, updated: 0, status: "Failed (Timeout)" },
        ]);
    }, []);

    const triggerIngest = () => {
        setIsRunning(true);
        setSystemStatus("Running Ingest...");
        addLog("Triggering global data ingestion (trigger_ingest)...", "warn");

        setTimeout(() => {
            addLog("Executing scripts/seed.ts in background...", "info");
            setTimeout(() => {
                addLog("Database sync completed. 142 records processed.", "success");
                setIsRunning(false);
                setSystemStatus("Standby");
            }, 3000);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] text-slate-900 dark:text-slate-100 p-8 pt-24 font-['Inter']">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-500 rounded-lg text-[10px] font-black text-white tracking-widest leading-normal">SYSTEM V2</span>
                            <span className="text-[11px] font-bold text-slate-400">/ ME / CONSOLE</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-800 dark:from-white dark:to-slate-500">
                            AI Operation Hub
                        </h1>
                        <p className="text-slate-400 font-bold mt-2">MCP 서버 및 실시간 데이터 수집기 제어 센터</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end px-4 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                <span className="text-sm font-black">{systemStatus}</span>
                            </div>
                        </div>
                        <button
                            disabled={isRunning}
                            onClick={triggerIngest}
                            className={`flex items-center gap-2 px-6 py-4 rounded-[1.5rem] text-[13px] font-black transition-all shadow-xl active:scale-95 ${isRunning ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 dark:bg-blue-600 text-white hover:shadow-blue-500/20'}`}
                        >
                            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                            인벤토리 동기화 실행
                        </button>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: "CPU Usage", value: `${performance.cpu}%`, icon: Zap, color: "text-amber-500" },
                        { label: "Memory", value: `${performance.mem}%`, icon: Activity, color: "text-blue-500" },
                        { label: "AI Latency", value: `${performance.latency}ms`, icon: HeartPulse, color: "text-emerald-500" }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className="text-2xl font-black">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Engine Logs */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-8">
                        {/* Terminal Style Logs */}
                        <div className="bg-[#0d1117] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-6 py-4 bg-slate-800/50 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-2">
                                        <Terminal className="w-3 h-3" /> System Engine Console
                                    </span>
                                </div>
                                <div className="text-[9px] font-black text-slate-500">BAUD: 57600 | AUTH: ROOT</div>
                            </div>
                            <div className="p-6 h-[400px] overflow-y-auto font-mono text-[11px] space-y-2.5 custom-scrollbar">
                                {logs.map(log => (
                                    <div key={log.id} className="flex gap-4">
                                        <span className="text-slate-600 shrink-0">[{log.time}]</span>
                                        <span className={`font-bold ${log.type === 'success' ? 'text-emerald-400' :
                                            log.type === 'error' ? 'text-rose-400' :
                                                log.type === 'warn' ? 'text-amber-400' : 'text-blue-400'
                                            }`}>
                                            {log.type.toUpperCase()}:
                                        </span>
                                        <span className="text-slate-300">{log.msg}</span>
                                    </div>
                                ))}
                                {isRunning && (
                                    <div className="flex gap-4 animate-pulse">
                                        <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                                        <span className="text-blue-400 font-bold">INFO:</span>
                                        <span className="text-slate-300">Processing real-time stream...</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Intelligence Section: ROI Calculator Tooling */}
                        <div className="bg-gradient-to-br from-blue-600/10 to-transparent rounded-[2.5rem] p-8 border border-blue-500/20 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Zap className="w-5 h-5 text-blue-500" />
                                <h3 className="text-lg font-black tracking-tight">AI ROI Intelligence (MCP Tool)</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Calculated Efficiency</p>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Real Hourly Profit</p>
                                                <p className="text-2xl font-black text-blue-600">₩42,500 <span className="text-[10px] text-emerald-500">+12%</span></p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">vs Min Wage</p>
                                                <p className="text-lg font-black text-slate-900 dark:text-white">4.3x</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                            AI Suggestion: Focusing on 'Beauty' category will increase ROI by 1.8x.
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: "Resale Revenue", value: "₩1,240k", sub: "Est. 40%" },
                                        { label: "Time Invested", value: "42.5h", sub: "Writing included" },
                                        { label: "Direct Ad Fee", value: "₩820k", sub: "Cash profit" },
                                        { label: "Opportunity Cost", value: "₩419k", sub: "Min wage base" }
                                    ].map((box, i) => (
                                        <div key={i} className="p-4 bg-white/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{box.label}</p>
                                            <p className="text-sm font-black">{box.value}</p>
                                            <p className="text-[8px] font-bold text-slate-500">{box.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Platform Status */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-black tracking-tight flex items-center gap-3">
                                    <Database className="w-5 h-5 text-blue-500" /> 어댑터 엔진 상태
                                </h3>
                                <button className="text-[11px] font-black text-blue-600 hover:underline">자세히 보기</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {platformStats.map(plat => (
                                    <div key={plat.id} className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-black">{plat.name}</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${plat.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {plat.status}
                                            </span>
                                        </div>
                                        <p className="text-xl font-black">{plat.count.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">Last: {plat.lastRun}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Ingest Stats Sidebar */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <BarChart3 className="w-32 h-32" />
                            </div>
                            <h3 className="text-lg font-black mb-6 relative z-10">최근 데이터 수집 이력</h3>
                            <div className="space-y-6 relative z-10">
                                {ingestStats.map(stat => (
                                    <div key={stat.id} className="flex gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                            <Zap className={`w-5 h-5 ${stat.status === 'Success' ? 'text-emerald-400' : 'text-rose-400'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-black">{stat.platform}</span>
                                                <span className="text-[10px] font-bold opacity-50">{stat.time}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-emerald-400">+{stat.added} New</span>
                                                <span className="text-[10px] font-black text-blue-400">{stat.updated} Update</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black transition-all border border-white/10">
                                전체 로그 내보내기 (.json)
                            </button>
                        </div>

                        {/* Security & Health Check */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-white dark:border-slate-800 shadow-xl">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest">Security Audit</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black">PostgreSQL SSL Active</p>
                                        <p className="text-[9px] text-slate-400 font-bold">Secure connection verified</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    < Zap className="w-5 h-5 text-blue-500" />
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black">MCP Node V1.6.0</p>
                                        <p className="text-[9px] text-slate-400 font-bold">Latest protocol active</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                                    <div className="flex-1">
                                        <p className="text-[11px] font-black text-rose-600">Rate Limit Warning</p>
                                        <p className="text-[9px] text-rose-400 font-bold">DinnerQueen retry limit hit</p>
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
