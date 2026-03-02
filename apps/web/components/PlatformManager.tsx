"use client";

import { useState, useEffect } from "react";
import { 
  Globe, 
  Plus, 
  Trash2, 
  Power, 
  PowerOff, 
  Check, 
  AlertCircle,
  Search,
  CheckCircle2
} from "lucide-react";

interface Platform {
  id: number;
  name: string;
  base_url: string;
  is_active: boolean;
}

export default function PlatformManager() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [urlList, setUrlList] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPlatforms = async () => {
    try {
      const res = await fetch("/api/admin/platforms");
      const data = await res.json();
      setPlatforms(data);
    } catch (e) {
      console.error("플랫폼 목록을 불러오지 못했습니다.", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleBulkAdd = async () => {
    if (!urlList.trim()) return;
    setIsSubmitting(true);
    setMessage(null);

    const urls = urlList
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/admin/platforms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlList: urls }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: `${data.added}개 플랫폼이 동기화되었습니다.` });
        setUrlList("");
        fetchPlatforms();
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/platforms/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (res.ok) {
        setPlatforms(platforms.map((p) => (p.id === id ? { ...p, is_active: !currentStatus } : p)));
      }
    } catch (e) {
      console.error("플랫폼 상태 변경에 실패했습니다.", e);
    }
  };

  const deletePlatform = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까? 플랫폼과 연결된 캠페인도 함께 삭제됩니다.")) return;
    try {
      const res = await fetch(`/api/admin/platforms/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPlatforms(platforms.filter((p) => p.id !== id));
      }
    } catch (e) {
      console.error("플랫폼 삭제에 실패했습니다.", e);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
          <div className="text-[10px] font-black uppercase text-slate-500 mb-1">전체 플랫폼</div>
          <div className="text-2xl font-black text-white">{platforms.length}</div>
        </div>
        <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
          <div className="text-[10px] font-black uppercase text-emerald-500 mb-1">활성 스크래퍼</div>
          <div className="text-2xl font-black text-white">{platforms.filter((p) => p.is_active).length}</div>
        </div>
        <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
          <div className="text-[10px] font-black uppercase text-rose-500 mb-1">비활성 / 대기</div>
          <div className="text-2xl font-black text-white">{platforms.filter((p) => !p.is_active).length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-black/20 rounded-3xl border border-slate-800/50 overflow-hidden">
          <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/30">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              등록된 플랫폼
            </h3>
            <Search className="w-4 h-4 text-slate-500" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-800/30 text-slate-500 uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">이름</th>
                  <th className="px-6 py-4">기본 주소</th>
                  <th className="px-6 py-4">상태</th>
                  <th className="px-6 py-4 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-6 py-4 bg-slate-800/10" />
                      </tr>
                    ))
                ) : platforms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-600 font-bold uppercase italic">
                      등록된 플랫폼이 없습니다. URL을 입력해 추가해 주세요.
                    </td>
                  </tr>
                ) : (
                  platforms.map((platform) => (
                    <tr key={platform.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-black text-white">{platform.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-500 truncate block max-w-[150px]">{platform.base_url}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase border ${
                            platform.is_active
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              platform.is_active ? "bg-emerald-500 shadow-lg shadow-emerald-500/50" : "bg-slate-500"
                            }`}
                          />
                          {platform.is_active ? "운영 중" : "중단"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleStatus(platform.id, platform.is_active)}
                            className={`p-2 rounded-lg border transition-all ${
                              platform.is_active
                                ? "text-slate-400 hover:text-rose-500 border-slate-700/50"
                                : "text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                            }`}
                            title={platform.is_active ? "비활성화" : "활성화"}
                          >
                            {platform.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => deletePlatform(platform.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 border border-slate-700/50 rounded-lg"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-3xl border border-slate-800/80 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-black text-white uppercase italic flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              일괄 등록
            </h4>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              URL 목록을 붙여넣으면 지원 플랫폼을 자동으로 등록합니다.
            </p>
          </div>

          <textarea
            value={urlList}
            onChange={(e) => setUrlList(e.target.value)}
            placeholder="https://www.revu.net\nhttps://www.reviewnote.co.kr\n..."
            className="flex-1 min-h-[150px] bg-black/40 border border-slate-800 rounded-2xl p-4 text-[11px] font-mono text-blue-300 transition-all focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none resize-none placeholder:text-slate-800"
          />

          {message && (
            <div
              className={`p-4 rounded-2xl text-[11px] font-black flex items-center gap-3 border ${
                message.type === "success"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <button
            onClick={handleBulkAdd}
            disabled={isSubmitting || !urlList.trim()}
            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              isSubmitting || !urlList.trim()
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-white text-slate-900 hover:bg-blue-600 hover:text-white shadow-xl shadow-blue-500/10 active:scale-95"
            }`}
          >
            {isSubmitting ? "동기화 중..." : "일괄 등록 실행"}
          </button>

          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-blue-200/60 leading-relaxed font-bold">
              시스템이 호스트명으로 플랫폼명을 자동 추출합니다. 중복된 데이터는 UPSERT로 처리됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
