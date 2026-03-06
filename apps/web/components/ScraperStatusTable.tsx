"use client";

type RunRow = {
  id: number | string;
  platform?: {
    name?: string | null;
  } | null;
  status?: string;
  records_added?: number | null;
  error_log?: string | null;
  start_time?: string | null;
};

const renderStatusLabel = (status?: string) => {
  if (status === "SUCCESS") return "완료";
  if (status === "RUNNING") return "실행 중";
  if (status === "FAILED") return "실패";
  if (status === "PENDING") return "대기";
  if (status === "QUEUED") return "대기열";
  if (status === "IN_PROGRESS") return "처리 중";
  return status || "미확인";
};

const resolveStatusClass = (status?: string) => {
  if (status === "SUCCESS") return "bg-green-100 text-green-700";
  if (status === "RUNNING" || status === "IN_PROGRESS" || status === "QUEUED" || status === "PENDING")
    return "bg-amber-100 text-amber-700 animate-pulse";
  if (status === "FAILED") return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-700";
};

export default function ScraperStatusTable({ initialRuns }: { initialRuns: RunRow[] }) {
  if (initialRuns.length === 0) {
    return <div className="text-center p-12 text-slate-500 font-medium">수집 이력 데이터가 없습니다.</div>;
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
        <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
          <tr>
            <th className="p-4 font-bold">실행 ID</th>
            <th className="p-4 font-bold text-slate-700">플랫폼</th>
            <th className="p-4 text-center font-bold">상태</th>
            <th className="p-4 font-bold">추가</th>
            <th className="p-4 font-bold w-1/3">오류 로그</th>
            <th className="p-4 font-bold">실행 시각</th>
          </tr>
        </thead>
        <tbody className="text-sm font-medium text-slate-600">
          {initialRuns.map((run, idx) => (
            <tr
              key={`${run.id}-${idx}`}
              className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors animate-in fade-in slide-in-from-top-2"
            >
              <td className="p-4 font-mono text-xs">#{run.id}</td>
              <td className="p-4 font-black text-slate-800">{run.platform?.name || "미확인"}</td>
              <td className="p-4 text-center">
                <span
                  className={`inline-flex items-center justify-center min-w-20 px-2.5 py-1.5 rounded-lg text-xs font-black ${resolveStatusClass(run.status)}`}
                >
                  {renderStatusLabel(run.status)}
                </span>
              </td>
              <td className="p-4 text-slate-700 font-bold">{run.records_added && run.records_added > 0 ? `+${run.records_added}` : "-"}</td>
              <td
                className="p-4 text-rose-500 max-w-sm truncate whitespace-pre-wrap font-mono text-[11px] bg-rose-50/50 rounded-lg"
                title={run.error_log || ""}
              >
                {run.error_log || "-"}
              </td>
              <td className="p-4 text-slate-400 font-mono text-xs">{run.start_time ? new Date(run.start_time).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
