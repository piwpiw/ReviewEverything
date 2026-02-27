"use client"

import { useState } from "react"
import ScraperStatusTable from "@/components/ScraperStatusTable";
import CsvUploadFallback from "@/components/CsvUploadFallback";

export default function AdminDashboard() {
    const [runs, setRuns] = useState([
        { id: 101, platform: { name: "Revu" }, status: "SUCCESS", records_added: 45, error_log: null, start_time: new Date().toISOString() },
        { id: 100, platform: { name: "Reviewnote" }, status: "FAILED", records_added: 0, error_log: "[SocketTimeout] Platform bot rejection detected. Re-evaluating proxies.", start_time: new Date(Date.now() - 3600000).toISOString() },
    ]);
    const [isInjecting, setIsInjecting] = useState(false);

    const triggerIngest = () => {
        if (isInjecting) return;
        setIsInjecting(true);
        setRuns([{
            id: Math.floor(Math.random() * 1000) + 200, platform: { name: "DinnerQueen" }, status: "RUNNING", records_added: 0, error_log: null, start_time: new Date().toISOString()
        }, ...runs]);

        setTimeout(() => setIsInjecting(false), 2000);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 pb-32">
            <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-slate-200 pr-0 lg:pr-8 flex flex-col gap-6 lg:min-h-[80vh]">
                <div>
                    <h2 className="text-2xl font-black mb-2 tracking-tighter text-slate-900">Admin Control</h2>
                    <p className="text-sm text-slate-500 font-medium">관리자 전용 제어판</p>
                </div>
                <ul className="flex flex-col gap-2">
                    <li><a href="/" className="flex items-center gap-3 p-3 text-sm font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><span>←</span> 홈으로 이동</a></li>
                    <li><div className="flex items-center gap-3 p-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-md"><span>📡</span> 크롤링 모니터링</div></li>
                    <li><div className="flex items-center gap-3 p-3 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"><span>📄</span> CSV 수동 복구</div></li>
                    <li><div className="flex items-center gap-3 p-3 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"><span>⚙️</span> 플랫폼 설정</div></li>
                </ul>

                <div className="mt-auto p-4 bg-blue-50/50 border border-blue-100 rounded-2xl hidden lg:block">
                    <h4 className="font-bold text-sm text-blue-900 mb-1">시스템 헬스 체크</h4>
                    <p className="text-xs text-blue-700 font-medium">어댑터 7개 정상 등록됨. 마지막 크롤링 10분 전.</p>
                </div>
            </aside>

            <main className="flex-1 flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                            수집 관제 센터
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                        </h1>
                        <p className="text-sm text-slate-500 mt-1 font-medium">최고 권한으로 전체 데이터 파이프라인을 제어합니다.</p>
                    </div>
                    <button
                        onClick={triggerIngest}
                        disabled={isInjecting}
                        className={`px-6 py-3.5 rounded-xl text-sm shadow hover:shadow-lg transition-all font-bold md:w-auto w-full text-center ${isInjecting ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5'}`}
                    >
                        {isInjecting ? '수집 스레드 가동중...' : '전체 플랫폼 스크래퍼 즉시 시작 🚀'}
                    </button>
                </div>

                {/* Fallback Mechanism Injected Here */}
                <CsvUploadFallback />

                <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-200 font-black text-sm text-slate-800 bg-slate-50 flex items-center justify-between">
                        <span>최근 크롤링 트랜잭션 내역 (Live)</span>
                    </div>
                    <ScraperStatusTable initialRuns={runs} />
                </div>
            </main>
        </div>
    )
}
