"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  MapPin,
  TrendingUp,
  Clock,
  Target,
  X,
  Search,
  Filter,
  Sparkles
} from "lucide-react";

/* ?? Constants ?? */
const PLATFORMS = [
  { id: "", label: "전체" },
  { id: "1", label: "revu" },
  { id: "2", label: "reviewnote" },
  { id: "3", label: "dinnerqueen" },
  { id: "4", label: "reviewplace" },
  { id: "5", label: "mrblog" },
  { id: "6", label: "seouloppa" },
  { id: "7", label: "gangnamfood" },
];

const CAMPAIGN_TABS = [
  { id: "VST", label: "방문형" },
  { id: "SHP", label: "배송형" },
  { id: "PRS", label: "프레스" },
];

const MEDIAS = [
  { id: "BP", label: "블로그" },
  { id: "IP", label: "인스타" },
  { id: "RS", label: "기자단" },
  { id: "YP", label: "유튜브" },
  { id: "SH", label: "쇼셜" },
  { id: "TK", label: "기타" },
];

const REGIONS: Record<string, string[]> = {
  "서울": ["전체", "강남", "홍대", "마포", "성수", "신촌"],
  "경기": ["전체", "수원", "성남", "고양", "용인", "부천"],
  "부산": ["전체", "해운대", "서면", "남포"],
  "대구": ["전체", "동성로", "수성"],
  "기타": ["전체", "전국", "온라인"],
};

const CATEGORIES = {
  VST: ["전체", "카페", "음식", "뷰티", "체험", "플레이스", "기타"],
  SHP: ["전체", "식품", "건강", "패션", "리빙", "디지털", "기타"],
};

/* ?? Components ?? */

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl text-[11px] font-black transition-all ${active ? "text-white shadow-lg shadow-slate-900/10" : "text-slate-500 bg-slate-100 hover:bg-slate-200"
        }`}
    >
      {active && (
        <motion.span
          layoutId="pill-bg"
          className="absolute inset-0 bg-slate-900 rounded-xl -z-10"
        />
      )}
      {label}
    </button>
  );
}

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [recentFilters, setRecentFilters] = useState<any[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem("re_recent_filters");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const cur = {
    platform: searchParams.get("platform_id") || "",
    type: searchParams.get("campaign_type") || "VST",
    media: searchParams.get("media_type") || "",
    depth1: searchParams.get("region_depth1") || "",
    depth2: searchParams.get("region_depth2") || "",
    category: searchParams.get("category") || "",
    minReward: searchParams.get("min_reward") || "",
    maxComp: searchParams.get("max_comp") || "",
  };

  const saveToRecent = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    const filterKey = params.toString();
    if (!filterKey) return;

    setRecentFilters(prev => {
      const filtered = prev.filter(f => f.key !== filterKey);
      const next = [{ key: filterKey, label: `필터: ${params.get("q") || "검색"}` }, ...filtered].slice(0, 5);
      localStorage.setItem("re_recent_filters", JSON.stringify(next));
      return next;
    });
  }, [searchParams]);

  const handleSelect = (name: string, val: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (val && val !== "?꾩껜") p.set(name, val);
    else p.delete(name);

    // Reset depth2 if depth1 changes
    if (name === "region_depth1") p.delete("region_depth2");

    startTransition(() => {
      router.push("/?" + p.toString(), { scroll: false });
    });
  };

  const handleQuickFilter = (type: 'win' | 'urgent' | 'hot') => {
    const p = new URLSearchParams(searchParams.toString());
    if (type === 'win') { p.set("max_comp", "1.0"); p.set("sort", "competition_asc"); }
    if (type === 'urgent') { p.set("sort", "deadline_asc"); }
    if (type === 'hot') { p.set("sort", "applicant_desc"); }
    router.push("/?" + p.toString(), { scroll: false });
  };

  const activeCount = Array.from(searchParams.keys()).filter(k => k !== 'view').length;

  return (
    <div className="flex flex-col gap-4">
      {/* ?? Layer 1: Global Tabs & Search Count ?? */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          {CAMPAIGN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSelect("campaign_type", tab.id)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${cur.type === tab.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              {tab.id === 'VST' && (cur.depth1 ? `?뱧 ${cur.depth1} 泥댄뿕` : tab.label)}
              {tab.id !== 'VST' && tab.label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent:</span>
          <div className="flex gap-2">
            {recentFilters.map((f, i) => (
              <button
                key={i}
                onClick={() => router.push("/?" + f.key)}
                className="px-3 py-1.5 bg-slate-50 text-[10px] font-black text-slate-500 rounded-lg hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ?? Layer 2: Main Filter Box ?? */}
      <div className="glass-card rounded-[2.5rem] border border-white/60 shadow-xl shadow-slate-900/5 p-6 flex flex-col gap-6 relative overflow-hidden">
        {/* Platform Selection */}
        <div className="flex items-start gap-4">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 w-12 shrink-0">플랫폼</span>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map(p => (
              <Pill key={p.id} active={cur.platform === p.id} label={p.label} onClick={() => handleSelect("platform_id", p.id)} />
            ))}
          </div>
        </div>

        {/* Media (Channel) Selection */}
        <div className="flex items-start gap-4">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 w-12 shrink-0">梨꾨꼸</span>
          <div className="flex flex-wrap gap-1.5">
            <Pill active={cur.media === ""} label="?꾩껜" onClick={() => handleSelect("media_type", "")} />
            {MEDIAS.map(m => (
              <Pill key={m.id} active={cur.media === m.id} label={m.label} onClick={() => handleSelect("media_type", m.id)} />
            ))}
          </div>
        </div>

        {/* Region Hierarchy (Visit Only) */}
        {cur.type === 'VST' && (
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
            <div className="flex items-start gap-4 text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest mt-2 w-12 shrink-0">지역</span>
              <div className="flex flex-wrap gap-1.5">
                <Pill active={cur.depth1 === ""} label="?꾩껜" onClick={() => handleSelect("region_depth1", "")} />
                {Object.keys(REGIONS).map(reg => (
                  <Pill key={reg} active={cur.depth1 === reg} label={reg} onClick={() => handleSelect("region_depth1", reg)} />
                ))}
              </div>
            </div>
            <AnimatePresence>
              {cur.depth1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-4 pl-16"
                >
                  <div className="flex flex-wrap gap-1">
                    {REGIONS[cur.depth1]?.map(sub => (
                      <button
                        key={sub}
                        onClick={() => handleSelect("region_depth2", sub)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${(cur.depth2 === sub || (sub === '?꾩껜' && !cur.depth2))
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                          }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Category Selection */}
        <div className="flex items-start gap-4">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 w-12 shrink-0">移댄뀒怨좊━</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES[cur.type as keyof typeof CATEGORIES]?.map(cat => (
              <Pill key={cat} active={cur.category === (cat === '?꾩껜' ? '' : cat)} label={cat} onClick={() => handleSelect("category", cat === '?꾩껜' ? '' : cat)} />
            ))}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-800 transition-colors mt-2"
        >
          <Filter className="w-3.5 h-3.5" />
          {isAdvancedOpen ? "?곸꽭 ?꾪꽣 ?リ린" : "?섏튂???곸꽭 ?꾪꽣 ?닿린 (蹂댁긽?? 寃쎌웳瑜???"}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100"
            >
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Target className="w-3 h-3 text-blue-500" /> ?쒖븞湲덉븸 (???댁긽)
                </label>
                <input
                  type="number"
                  placeholder="?? 50000"
                  defaultValue={cur.minReward}
                  onBlur={(e) => handleSelect("min_reward", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3 h-3 text-rose-500" /> 寃쎌웳瑜?(~:1 ?댄븯)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="?? 1.0"
                  defaultValue={cur.maxComp}
                  onBlur={(e) => handleSelect("max_comp", e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={saveToRecent}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" /> ???꾪꽣 議고빀 ???                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Access Chips */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest w-12 shrink-0">QUICK</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickFilter('win')}
              className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              ?렞 ?뱀꺼 ?뺣쪧 UP (1:1 ?댄븯)
            </button>
            <button
              onClick={() => handleQuickFilter('urgent')}
              className="px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              ???ㅻ뒛/?댁씪 留덇컧
            </button>
            <button
              onClick={() => handleQuickFilter('hot')}
              className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black border border-amber-100 hover:bg-amber-600 hover:text-white transition-all shadow-sm"
            >
              ?뵦 吏?먯옄 ??＜ ?멸린??            </button>
          </div>
        </div>
      </div>

      {/* ?? Layer 3: Filter Info & Reset ?? */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {isPending && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2 text-[10px] font-black text-blue-600"
              >
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                吏?ν삎 ?꾪꽣 遺꾩꽍 以?..
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {activeCount > 0 && (
          <button
            onClick={() => router.push("/", { scroll: false })}
            className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 shadow-sm border border-rose-100"
          >
            <X className="w-3 h-3" />
            寃???꾪꽣 珥덇린??({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
