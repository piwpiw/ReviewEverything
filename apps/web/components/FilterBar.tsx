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
  Sparkles,
  CalendarClock
} from "lucide-react";

/* ── Constants ── */
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
  { id: "RS", label: "릴스" },
  { id: "YP", label: "유튜브" },
  { id: "SH", label: "쇼츠" },
  { id: "TK", label: "틱톡" },
  { id: "CL", label: "클립" },
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

/* ── Components ── */

function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 rounded-xl text-[11px] font-black transition-all ${active ? "text-white shadow-lg shadow-slate-900/10" : "text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
        }`}
    >
      {active && (
        <motion.span
          layoutId="pill-bg"
          className="absolute inset-0 bg-slate-900 dark:bg-blue-600 rounded-xl -z-10"
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
  const [ddayValue, setDdayValue] = useState<number>(
    Number(searchParams.get("max_deadline_days") || 30)
  );
  const cur = {
    platform: searchParams.get("platform_id") || "",
    type: searchParams.get("campaign_type") || "VST",
    media: searchParams.get("media_type") || "",
    depth1: searchParams.get("region_depth1") || "",
    depth2: searchParams.get("region_depth2") || "",
    category: searchParams.get("category") || "",
    minReward: searchParams.get("min_reward") || "",
    maxComp: searchParams.get("max_comp") || "",
    maxDeadlineDays: searchParams.get("max_deadline_days") || "",
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
    if (val && val !== "전체") p.set(name, val);
    else p.delete(name);

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
      {/* ── Layer 1: Global Tabs & Search Count ── */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          {CAMPAIGN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleSelect("campaign_type", tab.id)}
              className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${cur.type === tab.id ? "bg-slate-900 dark:bg-blue-600 text-white shadow-lg" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {tab.id === 'VST' && (cur.depth1 ? `📍 ${cur.depth1} 체험단` : tab.label)}
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
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-500 rounded-lg hover:bg-slate-900 dark:hover:bg-blue-600 hover:text-white transition-all border border-slate-100 dark:border-slate-700"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Layer 2: Main Filter Box ── */}
      <div className="glass-card rounded-[2.5rem] border border-white/60 dark:border-slate-800 shadow-xl shadow-slate-900/5 p-6 flex flex-col gap-6 relative overflow-hidden bg-white dark:bg-slate-900">
        {/* Platform Selection */}
        <div className="flex items-start gap-4">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 w-12 shrink-0">플랫폼</span>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map(p => (
              <Pill key={p.id} active={cur.platform === p.id} label={p.label} onClick={() => handleSelect("platform_id", p.id)} />
            ))}
          </div>
        </div>

        {/* Media (Channel) Selection */}
        <div className="flex items-start gap-4">
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 w-12 shrink-0">채널</span>
          <div className="flex flex-wrap gap-1.5">
            <Pill active={cur.media === ""} label="전체" onClick={() => handleSelect("media_type", "")} />
            {MEDIAS.map(m => (
              <Pill key={m.id} active={cur.media === m.id} label={m.label} onClick={() => handleSelect("media_type", m.id)} />
            ))}
          </div>
        </div>

        {/* Region Hierarchy (Visit Only) */}
        {cur.type === 'VST' && (
          <div className="flex flex-col gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
            <div className="flex items-start gap-4 text-slate-400">
              <span className="text-[9px] font-black uppercase tracking-widest mt-2 w-12 shrink-0">지역</span>
              <div className="flex flex-wrap gap-1.5">
                <Pill active={cur.depth1 === ""} label="전체" onClick={() => handleSelect("region_depth1", "")} />
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
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${(cur.depth2 === sub || (sub === '전체' && !cur.depth2))
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
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
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 w-12 shrink-0">카테고리</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES[cur.type as keyof typeof CATEGORIES]?.map(cat => (
              <Pill key={cat} active={cur.category === (cat === '전체' ? '' : cat)} label={cat} onClick={() => handleSelect("category", cat === '전체' ? '' : cat)} />
            ))}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors mt-2"
        >
          <Filter className="w-3.5 h-3.5" />
          {isAdvancedOpen ? "상세 필터 닫기" : "수치형 상세 필터 열기 (보상액, 경쟁률 등)"}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isAdvancedOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-3 h-3 text-blue-500" /> 제안금액 (원 이상)
                  </label>
                  <input
                    type="number"
                    placeholder="예: 50000"
                    defaultValue={cur.minReward}
                    onBlur={(e) => handleSelect("min_reward", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-3 h-3 text-rose-500" /> 경쟁률 (~:1 이하)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="예: 1.0"
                    defaultValue={cur.maxComp}
                    onBlur={(e) => handleSelect("max_comp", e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <CalendarClock className="w-3 h-3 text-amber-500" />
                    마감 D-Day
                    <span className="ml-auto px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-black">
                      {ddayValue === 30 ? "무제한" : `D-${ddayValue}`}
                    </span>
                  </label>
                  <input
                    id="dday-slider"
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={ddayValue}
                    onChange={(e) => setDdayValue(Number(e.target.value))}
                    onMouseUp={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      handleSelect("max_deadline_days", v === "30" ? "" : v);
                    }}
                    onTouchEnd={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      handleSelect("max_deadline_days", v === "30" ? "" : v);
                    }}
                    className="w-full h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full appearance-none cursor-pointer accent-amber-500 mt-1"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-slate-400">
                    <span>D-1</span>
                    <span>D-15</span>
                    <span>무제한</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={saveToRecent}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all hover:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <Sparkles className="w-3.5 h-3.5" /> 현재 필터 조합 저장
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Access Chips */}
        <div className="flex flex-col gap-3 pt-6 border-t border-slate-50 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quick Filters</span>
            {recentFilters.length > 0 && (
              <button
                onClick={() => { setRecentFilters([]); localStorage.removeItem("re_recent_filters"); }}
                className="text-[9px] font-bold text-slate-300 hover:text-rose-500"
              >
                Clear Recent
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Real Intelligent Filters */}
            <button
              onClick={() => handleQuickFilter('win')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <Sparkles className="w-3 h-3" /> 꿀! 당첨 확률 UP (1:1 이하)
            </button>
            <button
              onClick={() => handleSelect("max_deadline_days", "3")}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black border border-rose-100 dark:border-rose-900/30 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
            >
              <Clock className="w-3 h-3" /> 마감 가임박 (D-3)
            </button>

            {/* Recent Search History */}
            {recentFilters.map((f, i) => (
              <button
                key={i}
                onClick={() => {
                  Object.entries(f).forEach(([k, v]) => handleSelect(k, v as string));
                }}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-bold border border-slate-100 dark:border-slate-700 hover:border-blue-500 transition-all"
              >
                #{f.region_depth1 || '전체'}_{f.category || '전체'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Layer 3: Filter Info & Reset ── */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3 h-8">
          <AnimatePresence>
            {isPending && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400"
              >
                <div className="w-2.5 h-2.5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                지능형 필터 분석 중...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {activeCount > 0 && (
          <button
            onClick={() => router.push("/", { scroll: false })}
            className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-xl hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2 shadow-sm border border-rose-100 dark:border-rose-900/30 active:scale-95"
          >
            <X className="w-3 h-3" />
            모든 필터 초기화({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
