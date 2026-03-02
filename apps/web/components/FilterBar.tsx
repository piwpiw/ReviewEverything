"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Filter, X, Sparkles, Clock, TrendingDown } from "lucide-react";

type RecentFilter = {
  key: string;
  label: string;
  savedAt: string;
};

const RECENT_KEY = "re_recent_filters";

const PLATFORMS = [
  { id: "", label: "전체" },
  { id: "1", label: "리뷰형" },
  { id: "2", label: "리뷰노트" },
  { id: "3", label: "DinnerQueen" },
  { id: "4", label: "리뷰플레이스" },
  { id: "5", label: "블로그형" },
  { id: "6", label: "서울옵파" },
  { id: "7", label: "강남푸드" },
];

const TYPES = [
  { id: "VST", label: "방문형" },
  { id: "SHP", label: "구매형" },
  { id: "PRS", label: "홍보형" },
] as const;

const MEDIAS = [
  { id: "", label: "전체" },
  { id: "BP", label: "블로그" },
  { id: "IP", label: "인스타" },
  { id: "RS", label: "릴스" },
  { id: "YP", label: "유튜브" },
  { id: "SH", label: "숏폼" },
  { id: "TK", label: "틱톡" },
  { id: "CL", label: "클립" },
];

const REGIONS: Record<string, string[]> = {
  "": ["전체"],
  Seoul: ["전체", "강남", "홍대", "마포", "성수", "종로"],
  Gyeonggi: ["전체", "수원", "성남", "고양", "용인", "부천"],
  Busan: ["전체", "해운대", "서면", "영도"],
  Daegu: ["전체", "동성로", "수성"],
  Other: ["전체", "원격", "온라인"],
};

const CATEGORIES: Record<string, string[]> = {
  VST: ["전체", "카페", "식당", "뷰티", "체험", "여가", "기타"],
  SHP: ["전체", "푸드", "건강", "패션", "리빙", "디지털", "기타"],
  PRS: ["전체", "상품", "서비스", "브랜드", "기타"],
};

function Pill({ active, label, onClick, groupId }: { active: boolean; label: string; onClick: () => void; groupId: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative px-3.5 py-2 rounded-xl text-[11px] font-black transition-all ${active
        ? "text-white shadow-lg shadow-blue-900/10 dark:shadow-blue-900/20"
        : "text-slate-500 hover:text-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-700/80"
        }`}
    >
      {active ? (
        <motion.span
          layoutId={`pill-bg-${groupId}`}
          className="absolute inset-0 bg-slate-900 dark:bg-blue-600 rounded-xl -z-10 shadow-inner"
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        />
      ) : null}
      <span className="relative z-10">{label}</span>
    </button>
  );
}

function loadRecents(): RecentFilter[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(RECENT_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentFilter[]) : [];
  } catch {
    return [];
  }
}

function saveRecents(value: RecentFilter[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENT_KEY, JSON.stringify(value));
}

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [recents, setRecents] = useState<RecentFilter[]>(() => loadRecents());

  const current = useMemo(() => {
    return {
      q: searchParams.get("q") || "",
      platformId: searchParams.get("platform_id") || "",
      type: searchParams.get("campaign_type") || "VST",
      media: searchParams.get("media_type") || "",
      region1: searchParams.get("region_depth1") || "",
      region2: searchParams.get("region_depth2") || "",
      category: searchParams.get("category") || "",
      minReward: searchParams.get("min_reward") || "",
      maxComp: searchParams.get("max_comp") || "",
      maxDeadlineDays: searchParams.get("max_deadline_days") || "",
    };
  }, [searchParams]);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (!value || value === "All") next.delete(key);
      else next.set(key, value);

      if (key === "region_depth1") next.delete("region_depth2");

      startTransition(() => router.push("/?" + next.toString(), { scroll: false }));
    },
    [router, searchParams],
  );

  const resetAll = useCallback(() => {
    startTransition(() => router.push("/", { scroll: false }));
  }, [router]);

  const saveCurrent = useCallback(() => {
    const key = searchParams.toString();
    if (!key) return;

    const labelPieces = [
      current.q ? `q:${current.q}` : null,
      current.type ? `type:${current.type}` : null,
      current.platformId ? `p:${current.platformId}` : null,
      current.category ? `cat:${current.category}` : null,
      current.region1 ? `r:${current.region1}` : null,
    ].filter(Boolean);

    const label = labelPieces.length ? labelPieces.join(" ") : "저장된 필터";

    setRecents((prev) => {
      const filtered = prev.filter((item) => item.key !== key);
      const next: RecentFilter[] = [{ key, label, savedAt: new Date().toISOString() }, ...filtered].slice(0, 6);
      saveRecents(next);
      return next;
    });
  }, [current, searchParams]);

  const activeCount = Array.from(searchParams.keys()).filter((k) => k !== "view").length;

  return (
    <section className="relative overflow-hidden group rounded-[2.5rem] border border-white/60 dark:border-slate-800/80 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] p-6 md:p-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl flex flex-col gap-6">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-[1rem] bg-slate-900 text-white dark:bg-blue-600 flex items-center justify-center shadow-lg shadow-slate-900/10">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">필터</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {isPending ? "적용 중..." : "필터를 조정해 보세요"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveCurrent}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-blue-600 text-xs font-black inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            저장
          </button>
          {activeCount > 0 ? (
            <button
              onClick={resetAll}
              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-300 text-xs font-black inline-flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              초기화 ({activeCount})
            </button>
          ) : null}
        </div>
      </header>

      {recents.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">최근 필터</span>
          {recents.map((item) => (
            <button
              key={item.key}
              onClick={() => router.push("/?" + item.key, { scroll: false })}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:border-blue-400"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              setRecents([]);
              saveRecents([]);
            }}
            className="px-3 py-2 rounded-xl text-[10px] font-black text-slate-400 hover:text-rose-500"
          >
            전체 삭제
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">유형</span>
          {TYPES.map((t) => (
            <Pill key={t.id} groupId="type" active={current.type === t.id} label={t.label} onClick={() => setParam("campaign_type", t.id)} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">플랫폼</span>
          {PLATFORMS.map((p) => (
            <Pill key={p.id || "all"} groupId="platform" active={current.platformId === p.id} label={p.label} onClick={() => setParam("platform_id", p.id)} />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">매체</span>
          {MEDIAS.map((m) => (
            <Pill key={m.id || "all"} groupId="media" active={current.media === m.id} label={m.label} onClick={() => setParam("media_type", m.id)} />
          ))}
        </div>

        {current.type === "VST" ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">시/도</span>
              {Object.keys(REGIONS)
                .filter((k) => k !== "")
                .map((region) => (
                  <Pill key={region} groupId="region1" active={current.region1 === region} label={region} onClick={() => setParam("region_depth1", region)} />
                ))}
              <Pill groupId="region1" active={!current.region1} label="전체" onClick={() => setParam("region_depth1", "")} />
            </div>

            {current.region1 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">구/군</span>
                {(REGIONS[current.region1] || ["전체"]).map((area) => (
                  <Pill
                    key={area}
                    groupId="region2"
                    active={current.region2 === (area === "전체" ? "" : area)}
                    label={area}
                    onClick={() => setParam("region_depth2", area === "전체" ? "" : area)}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">카테고리</span>
          {(CATEGORIES[current.type] || CATEGORIES.VST).map((cat) => (
            <Pill
              key={cat}
              groupId="category"
              active={current.category === (cat === "전체" ? "" : cat)}
              label={cat}
              onClick={() => setParam("category", cat === "전체" ? "" : cat)}
            />
          ))}
        </div>

        {/* 고급 필터: 슬라이더 컨트롤 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6">
              <label className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-1.5 tracking-widest">
                최소 보상 가치
              </label>
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-lg border border-amber-200/50">
                {current.minReward ? `${(Number(current.minReward) / 10000).toFixed(0)}만원 이상` : "전체"}
              </span>
            </div>
            <div className="relative flex items-center mb-2">
              <span className="absolute left-4 text-slate-400 text-sm font-bold">₩</span>
              <input
                value={current.minReward}
                onChange={(e) => setParam("min_reward", e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all shadow-inner"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <label className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-1.5 tracking-widest">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                마감 기한 (D-Day)
              </label>
              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-blue-200 shadow-sm">
                {current.maxDeadlineDays ? `D-${current.maxDeadlineDays} 이내` : "상관없음"}
              </span>
            </div>
            <div className="relative pt-2">
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={current.maxDeadlineDays || "30"}
                onChange={(e) => setParam("max_deadline_days", e.target.value === "30" ? "" : e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <div className="flex justify-between mt-2 text-[9px] font-black text-slate-400">
                <span>오늘마감</span>
                <span>15일</span>
                <span>전체</span>
              </div>
            </div>
            <div className="mt-4 flex gap-1.5">
              <button onClick={() => setParam("max_deadline_days", "1")} className="flex-1 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-[10px] font-black hover:bg-rose-100 transition-colors">긴급 (D-1)</button>
              <button onClick={() => setParam("max_deadline_days", "7")} className="flex-1 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 text-[10px] font-black hover:bg-blue-100 transition-colors">여유 (D-7)</button>
            </div>
          </div>

          <div className="p-5 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
            <div className="flex justify-between items-center mb-6">
              <label className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-1.5 tracking-widest">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                최대 경쟁률 컷
              </label>
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-emerald-200 shadow-sm">
                {current.maxComp ? `${current.maxComp}:1 이하` : "상관없음"}
              </span>
            </div>
            <div className="relative pt-2">
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={current.maxComp || "100"}
                onChange={(e) => setParam("max_comp", e.target.value === "100" ? "" : e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 dark:accent-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <div className="flex justify-between mt-2 text-[9px] font-black text-slate-400">
                <span>1:1</span>
                <span>50:1</span>
                <span>전체</span>
              </div>
            </div>
            <div className="mt-4 flex gap-1.5">
              <button onClick={() => setParam("max_comp", "1.5")} className="flex-1 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px] font-black hover:bg-emerald-100 transition-colors">당첨확률↑</button>
              <button onClick={() => setParam("max_comp", "10")} className="flex-1 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 text-[10px] font-black hover:bg-indigo-100 transition-colors">일반 (10:1)</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
