"use client";

import { motion } from "framer-motion";
import { Clock, Filter, Sparkles, X } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatFilterValue } from "@/lib/filterDisplay";
import { normalizeSearchParamValue } from "@/lib/searchParams";

type RecentFilter = { key: string; label: string; savedAt: string };

const RECENT_KEY = "re_recent_filters";

const PLATFORMS = [
  { id: "", label: "전체" },
  { id: "1", label: "레뷰" },
  { id: "2", label: "리뷰노트" },
  { id: "3", label: "디너의여왕" },
  { id: "4", label: "리뷰플레이스" },
  { id: "5", label: "미블" },
  { id: "7", label: "강남맛집" },
  { id: "12", label: "서울오빠" },
  { id: "15", label: "포블로그" },
  { id: "16", label: "핌블" },
  { id: "17", label: "아사뷰" },
  { id: "18", label: "놀러와" },
  { id: "19", label: "모단" },
  { id: "21", label: "링블" },
  { id: "22", label: "모블" },
  { id: "23", label: "픽미" },
  { id: "24", label: "리뷰마치" },
  { id: "25", label: "체험뷰" },
  { id: "27", label: "데일리뷰" },
  { id: "30", label: "티블" },
  { id: "31", label: "클라우드리뷰" },
  { id: "70", label: "리뷰팅" },
];

const TYPES = [
  { id: "", label: "전체" },
  { id: "VST", label: "방문형" },
  { id: "SHP", label: "쇼핑형" },
  { id: "PRS", label: "구매형" },
  { id: "SNS", label: "SNS형" },
  { id: "EVT", label: "이벤트형" },
  { id: "APP", label: "앱형" },
  { id: "PRM", label: "홍보형" },
  { id: "ETC", label: "기타" },
];

const MEDIAS = [
  { id: "", label: "전체" },
  { id: "BP", label: "블로그" },
  { id: "IP", label: "인스타" },
  { id: "YP", label: "유튜브" },
  { id: "RS", label: "리뷰" },
  { id: "SH", label: "쇼핑" },
  { id: "TK", label: "쿠폰" },
  { id: "CL", label: "클립" },
  { id: "RD", label: "광고" },
  { id: "FB", label: "페북" },
  { id: "X", label: "X" },
  { id: "SN", label: "숏폼" },
  { id: "TT", label: "타임" },
  { id: "OTHER", label: "기타" },
];

const REGIONS: Record<string, string[]> = {
  "": ["전체"],
  서울: ["전체", "강남", "홍대", "명동", "이태원", "서초", "잠실", "영등포", "종로", "마포", "신촌", "건대", "여의도", "송파"],
  경기: ["전체", "수원", "성남", "고양", "부천", "안산", "용인", "평택", "파주", "성남 분당", "일산"],
  부산: ["전체", "해운대", "서면", "남포동", "광안리", "연산", "기장", "부산진"],
  대구: ["전체", "동성로", "수성", "달서", "수성구", "중구", "달성군"],
  인천: ["전체", "송도", "부평", "연수", "남동구", "계양구"],
  대전: ["전체", "둔산동", "유성", "중구", "서구", "유성구"],
  광주: ["전체", "상무", "봉선동", "첨단", "송정동", "월드컵", "충장로", "서구", "북구"],
  울산: ["전체", "남구", "북구", "중구", "울주", "동구"],
  제주: ["전체", "제주시", "애월", "서귀포", "한림", "협재", "조천", "한경면"],
  세종: ["전체", "한누리", "도담동", "어진동", "가람동", "조치원"],
  강원: ["전체", "춘천", "강릉", "동해", "속초", "원주"],
  경북: ["전체", "경산", "안동", "칠곡", "포항", "구미"],
  경남: ["전체", "창원", "진주", "김해", "양산", "부산", "통영"],
  충북: ["전체", "청주", "충주", "진천", "증평"],
  충남: ["전체", "천안", "공주", "아산", "논산", "홍성", "당진"],
  전북: ["전체", "전주", "군산", "익산", "완주", "남원"],
  전남: ["전체", "여수", "목포", "순천", "광양", "해남"],
  경기도: ["전체", "성남", "수원", "고양", "부천", "안양", "안산", "용인", "파주", "평택"],
};

const CATEGORIES: Record<string, string[]> = {
  "": ["전체", "식음료", "생활", "뷰티", "교육", "금융", "여행", "의류", "가전", "기타"],
  VST: ["전체", "식음료", "관광", "문화", "체험", "펜션", "맛집", "레저", "카페", "반려동물"],
  SHP: ["전체", "패션", "뷰티", "디지털", "생활용품", "건강", "식품", "가전", "홈리빙", "펫", "반려동물"],
  PRS: ["전체", "식음료", "식품"],
  SNS: ["전체", "브이로그", "브랜딩", "인플루언서", "스타일", "리뷰", "커머스"],
  EVT: ["전체", "오픈", "행사", "기획", "오프라인", "체험단", "세미나", "캠페인"],
  APP: ["전체", "앱설치", "리워드", "기능체험", "구매", "미션", "레퍼럴"],
  PRM: ["전체", "브랜드", "상품", "홍보"],
  ETC: ["전체", "기타"],
};

type FilterQuery = {
  q: string;
  platformId: string;
  type: string;
  media: string;
  region1: string;
  region2: string;
  category: string;
  minReward: string;
  maxComp: string;
  maxDeadlineDays: string;
};

const FILTER_PARAM_KEYS = [
  "q",
  "platform_id",
  "campaign_type",
  "media_type",
  "region_depth1",
  "region_depth2",
  "category",
  "min_reward",
  "max_comp",
  "max_deadline_days",
] as const;

const RESET_PARAM_KEYS = [...FILTER_PARAM_KEYS, "page"] as const;

function Pill({
  active,
  label,
  onClick,
  groupId,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  groupId: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg px-3 py-1.5 text-sm font-black transition-all ${active
        ? "bg-slate-900 text-white dark:bg-blue-600 shadow-md transform scale-[1.02]"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
        }`}
    >
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
  const isMapMode = searchParams.get("view") === "map";
  const [isPending, startTransition] = useTransition();
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [recents, setRecents] = useState<RecentFilter[]>(() => loadRecents());
  const current = useMemo<FilterQuery>(() => {
    return {
      q: normalizeSearchParamValue(searchParams.get("q")) || "",
      platformId: normalizeSearchParamValue(searchParams.get("platform_id")) || "",
      type: normalizeSearchParamValue(searchParams.get("campaign_type")) || "",
      media: normalizeSearchParamValue(searchParams.get("media_type")) || "",
      region1: normalizeSearchParamValue(searchParams.get("region_depth1")) || "",
      region2: normalizeSearchParamValue(searchParams.get("region_depth2")) || "",
      category: normalizeSearchParamValue(searchParams.get("category")) || "",
      minReward: normalizeSearchParamValue(searchParams.get("min_reward")) || "",
      maxComp: normalizeSearchParamValue(searchParams.get("max_comp")) || "",
      maxDeadlineDays: normalizeSearchParamValue(searchParams.get("max_deadline_days")) || "",
    };
  }, [searchParams]);

  const regionDepth1Options = useMemo(() => Object.keys(REGIONS).filter((region) => region !== ""), []);

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (!value || value === "전체") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      if (key === "region_depth1") {
        next.delete("region_depth2");
      }
      if (key !== "page") {
        next.delete("page");
      }
      const target = next.toString() ? `/?${next.toString()}` : "/";
      startTransition(() => router.replace(target, { scroll: false }));
    },
    [router, searchParams],
  );

  const resetAll = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    RESET_PARAM_KEYS.forEach((key) => next.delete(key));
    const target = next.toString() ? `/?${next.toString()}` : "/";
    startTransition(() => router.replace(target, { scroll: false }));
  }, [router, searchParams]);

  const commitDraftParam = useCallback(
    (key: "min_reward" | "max_comp" | "max_deadline_days", value: string) => {
      setParam(key, value.trim());
    },
    [setParam],
  );

  const saveCurrent = useCallback(() => {
    const savedParams = new URLSearchParams();
    [
      ["q", current.q],
      ["platform_id", current.platformId],
      ["campaign_type", current.type],
      ["media_type", current.media],
      ["region_depth1", current.region1],
      ["region_depth2", current.region2],
      ["category", current.category],
      ["min_reward", current.minReward],
      ["max_comp", current.maxComp],
      ["max_deadline_days", current.maxDeadlineDays],
    ].forEach(([paramKey, value]) => {
      if (value) savedParams.set(paramKey, value);
    });
    const key = savedParams.toString();
    if (!key) return;
    const parts = [
      current.q ? `키워드:${current.q}` : null,
      current.type ? `유형:${formatFilterValue("campaign_type", current.type)}` : null,
      current.platformId ? `플랫폼:${formatFilterValue("platform_id", current.platformId)}` : null,
      current.category ? `카테고리:${current.category}` : null,
      current.region1 ? `지역:${current.region1}` : null,
      current.media ? `매체:${formatFilterValue("media_type", current.media)}` : null,
    ].filter(Boolean) as string[];

    const label = parts.length ? parts.join(" | ") : "현재 조건";

    setRecents((prev) => {
      const filtered = prev.filter((item) => item.key !== key);
      const next: RecentFilter[] = [{ key, label, savedAt: new Date().toISOString() }, ...filtered].slice(0, 6);
      saveRecents(next);
      return next;
    });
  }, [current]);

  const togglePanel = useCallback(() => {
    setFiltersVisible((prev) => {
      return !prev;
    });
  }, []);
  const openListModeWithFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("view", "list");
    startTransition(() => router.replace(`/?${next.toString()}`, { scroll: false }));
  }, [router, searchParams, startTransition]);

  const isPanelVisible = isMapMode ? false : filtersVisible;
  const activeCount = Array.from(searchParams.entries()).filter(
    ([key, value]) => FILTER_PARAM_KEYS.includes(key as (typeof FILTER_PARAM_KEYS)[number]) && Boolean(normalizeSearchParamValue(value)),
  ).length;
  const categories = CATEGORIES[current.type] || CATEGORIES[""];
  const regionAreas = REGIONS[current.region1] || ["전체"];
  const activeBadges = useMemo(() => {
    const parts = [
      current.type ? `유형:${formatFilterValue("campaign_type", current.type)}` : null,
      current.platformId ? `플랫폼:${formatFilterValue("platform_id", current.platformId)}` : null,
      current.media ? `매체:${formatFilterValue("media_type", current.media)}` : null,
      current.region1 ? `지역:${current.region1}` : null,
      current.region2 ? `세부:${current.region2}` : null,
      current.category ? `카테고리:${current.category}` : null,
      current.minReward ? `최소보상:${current.minReward}` : null,
      current.maxComp ? `경쟁률:${current.maxComp}` : null,
      current.maxDeadlineDays ? `D-Day:${current.maxDeadlineDays}` : null,
    ].filter(Boolean) as string[];

    return parts;
  }, [current]);

  return (
    <section className="nav-glass rounded-[2rem] p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 blur-[50px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[70px] pointer-events-none" />

      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Filter className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Smart Search</span>
              {isPending && (
                <div className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce delay-75" />
                  <span className="w-1 h-1 rounded-full bg-blue-500 animate-bounce delay-150" />
                </div>
              )}
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              내 조건에 딱 맞는 캠페인을 고를 수 있어요
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={isMapMode ? openListModeWithFilters : togglePanel}
            className={`btn-premium px-5 py-2.5 text-sm font-black flex items-center gap-2 ${isPanelVisible ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : ""
              }`}
          >
            {isPanelVisible ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
            {isPanelVisible ? "필터 닫기" : isMapMode ? "목록에서 편집하기" : "더 많은 필터 보기"}
          </button>

          {!isMapMode && (
            <button
              onClick={saveCurrent}
              disabled={!activeCount}
              className="btn-premium px-5 py-2.5 text-sm font-black bg-blue-600 border-blue-500 text-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              검색 조건 저장
            </button>
          )}

          {activeCount > 0 && (
            <button
              onClick={resetAll}
              className="btn-premium px-5 py-2.5 text-sm font-black bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              모두 지우기 ({activeCount})
            </button>
          )}
        </div>
      </header>

      {!isMapMode && recents.length > 0 && (
        <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">최근 검색</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {recents.map((item) => (
              <button
                key={item.key}
                onClick={() => router.replace(`/?${item.key}`, { scroll: false })}
                className="group relative px-4 py-2 rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex items-center gap-2"
              >
                <span className="truncate max-w-[200px]">{item.label}</span>
                <span className="text-[9px] text-slate-400 opacity-60">#{new Date(item.savedAt).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isPanelVisible ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 animate-in fade-in zoom-in-95 duration-500"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="px-1 text-[11px] font-black text-slate-400 underline decoration-blue-500/50 underline-offset-4 uppercase tracking-widest">캠페인 속성</span>
                <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-12 text-[11px] font-bold text-slate-400">유형</span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {TYPES.map((item) => (
                        <Pill
                          key={item.id || "all-type"}
                          groupId="type"
                          active={current.type === item.id}
                          label={item.label}
                          onClick={() => setParam("campaign_type", item.id)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-12 text-[11px] font-bold text-slate-400">매체</span>
                    <div className="flex flex-wrap gap-1.5 flex-1">
                      {MEDIAS.map((item) => (
                        <Pill
                          key={item.id || "all-media"}
                          groupId="media"
                          active={current.media === item.id}
                          label={item.label}
                          onClick={() => setParam("media_type", item.id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="px-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">플랫폼 네트워크</span>
                <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORMS.map((item) => (
                      <Pill
                        key={item.id || "all-platform"}
                        groupId="platform"
                        active={current.platformId === item.id}
                        label={item.label}
                        onClick={() => setParam("platform_id", item.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="px-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">위치 및 카테고리</span>
                <div className="grid grid-cols-2 gap-3 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 ml-1">시/도</label>
                    <select
                      value={current.region1}
                      onChange={(e) => setParam("region_depth1", e.target.value)}
                      className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <option value="">전국</option>
                      {regionDepth1Options.map((region) => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 ml-1">시/군/구</label>
                    <select
                      value={current.region2}
                      onChange={(e) => setParam("region_depth2", e.target.value)}
                      disabled={!current.region1}
                      className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-40"
                    >
                      <option value="">전체</option>
                      {(current.region1 ? regionAreas : ["전체"]).map((area) => (
                        <option key={area} value={area === "전체" ? "" : area}>{area}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 ml-1">상세 카테고리</label>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.slice(0, 12).map((category) => (
                        <Pill
                          key={category}
                          groupId="category"
                          active={current.category === (category === "전체" ? "" : category)}
                          label={category}
                          onClick={() => setParam("category", category === "전체" ? "" : category)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="px-1 text-[11px] font-black text-slate-400 uppercase tracking-widest">원하는 보상/경쟁률 설정</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "최소 보상", key: "min_reward", value: current.minReward, placeholder: "0", unit: "만원" },
                    { label: "최대 경쟁률", key: "max_comp", value: current.maxComp, placeholder: "제한없음", unit: ":1" },
                    { label: "최대 D-Day", key: "max_deadline_days", value: current.maxDeadlineDays, placeholder: "제한없음", unit: "일" },
                  ].map((field) => (
                    <div key={field.key} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                      <label className="block text-[10px] font-black text-slate-400 mb-2">{field.label}</label>
                      <div className="flex items-center gap-1">
                        <input
                          key={`${field.key}-${field.value}`}
                          defaultValue={field.value}
                          onBlur={(e) => commitDraftParam(field.key as any, e.currentTarget.value)}
                          onKeyDown={(e) => e.key === "Enter" && commitDraftParam(field.key as any, e.currentTarget.value)}
                          placeholder={field.placeholder}
                          className="w-full bg-transparent border-none p-0 text-sm font-black focus:ring-0 placeholder:text-slate-300"
                        />
                        <span className="text-[10px] font-black text-blue-500/60">{field.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : isMapMode ? (
        <div className="flex items-center justify-between px-2 py-3 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/20">
          <div className="flex flex-wrap gap-2 text-[11px] font-bold text-blue-700 dark:text-blue-300">
            {activeBadges.length === 0 ? (
              <span className="opacity-60">현재 모든 캠페인을 지도에 표시 중입니다</span>
            ) : (
              activeBadges.map((badge) => (
                <span key={badge} className="bg-white/80 dark:bg-blue-900/50 px-2 py-1 rounded-lg shadow-sm">{badge}</span>
              ))
            )}
          </div>
          <button onClick={openListModeWithFilters} className="text-[11px] font-black text-blue-600 underline underline-offset-4">필터 수정하기</button>
        </div>
      ) : (
        <div className="py-4 text-center">
          <p className="text-xs font-bold text-slate-400 tracking-wide">
            지금 <span className="text-blue-600 dark:text-blue-400 font-black px-1.5">{activeCount}개</span>의 필터가 적용되어 있어요.
          </p>
        </div>
      )}
    </section>
  );
}
