"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Globe,
  Power,
  PowerOff,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

type Platform = {
  id: number;
  name: string;
  base_url: string;
  is_active: boolean;
  adapter_ready?: boolean;
};

export default function PlatformManager() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [urlList, setUrlList] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchPlatforms = async () => {
    try {
      const res = await fetch("/api/admin/platforms");
      if (!res.ok) throw new Error(`플랫폼 조회 실패 (${res.status})`);
      const data = (await res.json()) as Platform[];
      setPlatforms(Array.isArray(data) ? data : []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "플랫폼 목록을 불러올 수 없습니다.";
      setMessage({ type: "error", text: message });
      console.error("플랫폼 조회 실패", e);
      setPlatforms([]);
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
      const data = (await res.json()) as { added?: number; error?: string };
      if (res.ok) {
        setMessage({ type: "success", text: `${data.added ?? 0}개 플랫폼이 동기화되었습니다.` });
        setUrlList("");
        await fetchPlatforms();
      } else {
        setMessage({ type: "error", text: data.error || "일괄 등록에 실패했습니다." });
      }
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "일괄 등록 처리 중 오류가 발생했습니다." });
      console.error("일괄 등록 중 에러", e);
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
      if (!res.ok) throw new Error(`상태 변경 실패 (${res.status})`);
      setPlatforms((prev) => prev.map((platform) => (platform.id === id ? { ...platform, is_active: !currentStatus } : platform)));
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "상태 변경에 실패했습니다." });
      console.error("상태 변경 실패", e);
    }
  };

  const deletePlatform = async (id: number) => {
    if (!confirm("정말로 이 플랫폼을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/platforms/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`삭제 실패 (${res.status})`);
      setPlatforms((prev) => prev.filter((platform) => platform.id !== id));
      setMessage({ type: "success", text: "플랫폼이 삭제되었습니다." });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "플랫폼 삭제에 실패했습니다." });
      console.error("플랫폼 삭제 실패", e);
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
          <div className="text-[10px] font-black uppercase text-emerald-500 mb-1">운영 중</div>
          <div className="text-2xl font-black text-white">{platforms.filter((platform) => platform.is_active).length}</div>
        </div>
        <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50">
          <div className="text-[10px] font-black uppercase text-rose-500 mb-1">비활성</div>
          <div className="text-2xl font-black text-white">{platforms.filter((platform) => !platform.is_active).length}</div>
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
                  <th className="px-6 py-4">기본 URL</th>
                  <th className="px-6 py-4">상태</th>
                  <th className="px-6 py-4 text-right">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-4 bg-slate-800/10" />
                    </tr>
                  ))
                ) : platforms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-600 font-bold uppercase italic">
                      등록된 플랫폼이 없습니다. URL을 입력해 동기화해 보세요.
                    </td>
                  </tr>
                ) : (
                  platforms.map((platform) => (
                    <tr key={platform.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-black text-white">{platform.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-500 truncate block max-w-[180px]">{platform.base_url}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase border ${
                            platform.is_active
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${platform.adapter_ready ? "bg-emerald-500" : "bg-slate-500"}`} />
                          {platform.adapter_ready ? "IMPLEMENTED" : "NOT READY"}
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
              URL 목록을 붙여넣으면 저장된 플랫폼을 자동으로 등록합니다.
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
            <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-[10px] text-blue-200/60 leading-relaxed font-bold">
              시스템이 호스트명으로 플랫폼명을 자동 추출합니다. 중복 데이터는 UPSERT로 처리됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
