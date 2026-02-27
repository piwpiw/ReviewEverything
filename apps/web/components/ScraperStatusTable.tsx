"use client"

export default function ScraperStatusTable({ initialRuns }: { initialRuns: any[] }) {
    if (initialRuns.length === 0) return (
        <div className="text-center p-12 text-slate-500 font-medium">크롤링 실행 이력이 없습니다.</div>
    )

    return (
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                        <th className="p-4 font-bold">배치 ID</th>
                        <th className="p-4 font-bold text-slate-700">타겟 플랫폼</th>
                        <th className="p-4 text-center font-bold">실행 상태</th>
                        <th className="p-4 font-bold">저장된 레코드</th>
                        <th className="p-4 font-bold w-1/3">에러 트리거 (Log)</th>
                        <th className="p-4 font-bold">시작 일시</th>
                    </tr>
                </thead>
                <tbody className="text-sm font-medium text-slate-600">
                    {initialRuns.map((run, idx) => (
                        <tr key={`${run.id}-${idx}`} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors animate-in fade-in slide-in-from-top-2">
                            <td className="p-4 font-mono text-xs">#{run.id}</td>
                            <td className="p-4 font-black text-slate-800">{run.platform?.name || "Unknown"}</td>
                            <td className="p-4 text-center">
                                <span className={`inline-flex items-center justify-center min-w-20 px-2.5 py-1.5 rounded-lg text-xs font-black  ${run.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : run.status === 'RUNNING' ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-red-100 text-red-700'}`}>
                                    {run.status === 'RUNNING' ? '수집중...' : run.status}
                                </span>
                            </td>
                            <td className="p-4 text-slate-700 font-bold">{run.records_added > 0 ? `+${run.records_added}건` : '-'}</td>
                            <td className="p-4 text-red-500 max-w-sm truncate whitespace-pre-wrap font-mono text-[11px] bg-red-50/50 rounded-lg" title={run.error_log}>
                                {run.error_log || "특이사항 없음"}
                            </td>
                            <td className="p-4 text-slate-400 font-mono text-xs">{new Date(run.start_time).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
