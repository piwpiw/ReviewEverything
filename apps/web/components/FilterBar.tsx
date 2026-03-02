"use client";

import { motion } from "framer-motion";
import { Clock, Filter, Sparkles, X } from "lucide-react";
import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type RecentFilter = { key: string; label: string; savedAt: string };

const RECENT_KEY = "re_recent_filters";
const FILTER_VISIBILITY_KEY = "re_filter_panel_visible";

const PLATFORMS = [
  { id: "", label: "전체" },
  { id: "1", label: "Revu" },
  { id: "2", label: "Reviewnote" },
  { id: "3", label: "DinnerQueen" },
  { id: "4", label: "ReviewPlace" },
  { id: "5", label: "Seouloppa" },
  { id: "6", label: "MrBlog" },
  { id: "7", label: "GangnamFood" },
  { id: "8", label: "TastyTalk" },
  { id: "9", label: "Fooding" },
  { id: "10", label: "StyleReview" },
  { id: "11", label: "CreatorWave" },
  { id: "12", label: "TasteNow" },
  { id: "13", label: "NaverMap" },
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
      className={`relative rounded-lg px-4 py-2 text-xs font-black transition-all ${{
        ["bg-slate-900 text-white dark:bg-blue-600"]: active,
        ["bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"]: !active,
      }[active.toString()]}`}
    >
      {active ? <motion.span layoutId={`pill-${groupId}`} className="absolute inset-0 -z-10 rounded-lg bg-slate-900 dark:bg-blue-600" /> : null}
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

function parseVisibleDefault() {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(FILTER_VISIBILITY_KEY);
  if (raw === null) return false;
  return raw === "1";
}

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMapMode = searchParams.get("view") === "map";
  const [isPending, startTransition] = useTransition();
  const [filtersVisible, setFiltersVisible] = useState(() => {
    const saved = parseVisibleDefault();
    return saved;
  });
  const [recents, setRecents] = useState<RecentFilter[]>(() => loadRecents());
  const current = useMemo<FilterQuery>(() => {
    return {
      q: searchParams.get("q") || "",
      platformId: searchParams.get("platform_id") || "",
      type: searchParams.get("campaign_type") || "",
      media: searchParams.get("media_type") || "",
      region1: searchParams.get("region_depth1") || "",
      region2: searchParams.get("region_depth2") || "",
      category: searchParams.get("category") || "",
      minReward: searchParams.get("min_reward") || "",
      maxComp: searchParams.get("max_comp") || "",
      maxDeadlineDays: searchParams.get("max_deadline_days") || "",
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
      startTransition(() => router.push(`/?${next.toString()}`, { scroll: false }));
    },
    [router, searchParams],
  );

  const resetAll = useCallback(() => {
    startTransition(() => router.push("/", { scroll: false }));
  }, [router]);

  const saveCurrent = useCallback(() => {
    const key = searchParams.toString();
    if (!key) return;
    const parts = [
      current.q ? `키워드:${current.q}` : null,
      current.type ? `유형:${current.type}` : null,
      current.platformId ? `플랫폼:${current.platformId}` : null,
      current.category ? `카테고리:${current.category}` : null,
      current.region1 ? `지역:${current.region1}` : null,
      current.media ? `매체:${current.media}` : null,
    ].filter(Boolean) as string[];

    const label = parts.length ? parts.join(" | ") : "현재 조건";

    setRecents((prev) => {
      const filtered = prev.filter((item) => item.key !== key);
      const next: RecentFilter[] = [{ key, label, savedAt: new Date().toISOString() }, ...filtered].slice(0, 6);
      saveRecents(next);
      return next;
    });
  }, [current, searchParams]);

  const togglePanel = useCallback(() => {
    setFiltersVisible((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(FILTER_VISIBILITY_KEY, next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const isPanelVisible = isMapMode ? false : filtersVisible;
  const activeCount = Array.from(searchParams.keys()).filter((k) => k !== "view").length;
  const categories = CATEGORIES[current.type] || CATEGORIES[""];
  const regionAreas = REGIONS[current.region1] || ["전체"];
  const activeBadges = useMemo(() => {
    const parts = [
      current.type ? `유형:${current.type}` : null,
      current.platformId ? `플랫폼:${current.platformId}` : null,
      current.media ? `매체:${current.media}` : null,
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
    <section className="relative rounded-3xl border border-white/60 bg-white/90 p-6 dark:bg-slate-900/90">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white dark:bg-blue-600 flex items-center justify-center">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">필터 패널</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">
              {isPending ? "필터 적용 중..." : "조건을 설정해 캠페인을 빠르게 찾으세요"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={togglePanel}
            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-black text-white dark:bg-blue-600"
          >
            {isPanelVisible ? "필터 닫기" : isMapMode ? "지도에서 필터 열기" : "필터 펼치기"}
          </button>

          {!isMapMode && (
            <button
              onClick={saveCurrent}
              className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-black text-white dark:bg-blue-600"
            >
              <Sparkles className="mr-1 inline h-4 w-4" />
              현재 조건 저장
            </button>
          )}

          {activeCount > 0 ? (
            <button
              onClick={resetAll}
              className="rounded-xl bg-rose-50 px-4 py-2 text-sm font-black text-rose-600 dark:bg-rose-900/20 dark:text-rose-300"
            >
              <X className="mr-1 inline h-4 w-4" />
              초기화({activeCount})
            </button>
          ) : null}
        </div>
      </header>

      {!isMapMode && recents.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-black text-slate-400">최근 조건</span>
          {recents.map((item) => (
            <button
              key={item.key}
              onClick={() => router.push(`/?${item.key}`, { scroll: false })}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 dark:border-slate-700 dark:bg-slate-800"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {isPanelVisible ? (
        <div className="max-h-[48vh] overflow-y-auto space-y-4 pr-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-xs font-black text-slate-400">유형</span>
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-xs font-black text-slate-400">플랫폼</span>
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

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-xs font-black text-slate-400">매체</span>
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

          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
              <label className="mb-2 block text-xs font-black text-slate-500">지역 1단계</label>
              <select
                value={current.region1}
                onChange={(e) => {
                  const next = e.target.value;
                  setParam("region_depth1", next);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">전체</option>
                {regionDepth1Options.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
              <label className="mb-2 text-xs font-black text-slate-500">지역 2단계(시군구)</label>
              <select
                value={current.region2}
                onChange={(e) => {
                  const next = e.target.value;
                  setParam("region_depth2", next);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                disabled={!current.region1}
              >
                <option value="">전체</option>
                {(current.region1 ? regionAreas : ["전체"]).map((area) => (
                  <option key={area} value={area === "전체" ? "" : area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="w-16 text-xs font-black text-slate-400">카테고리</span>
            {categories.map((category) => (
              <Pill
                key={category}
                groupId="category"
                active={current.category === (category === "전체" ? "" : category)}
                label={category}
                onClick={() => setParam("category", category === "전체" ? "" : category)}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <label className="mb-2 flex items-center text-xs font-black text-slate-500">
                <Clock className="mr-2 h-3.5 w-3.5" />
                최소 보상(만원)
              </label>
              <input
                value={current.minReward}
                onChange={(e) => setParam("min_reward", e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                inputMode="numeric"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <label className="mb-2 text-xs font-black text-slate-500">최대 경쟁률</label>
              <input
                value={current.maxComp}
                onChange={(e) => setParam("max_comp", e.target.value)}
                placeholder="예: 10"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                inputMode="numeric"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <label className="mb-2 text-xs font-black text-slate-500">최대 D-Day</label>
              <input
                value={current.maxDeadlineDays}
                onChange={(e) => setParam("max_deadline_days", e.target.value)}
                placeholder="예: 7"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
                inputMode="numeric"
              />
            </div>
          </div>
        </div>
      ) : isMapMode ? (
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {activeBadges.length === 0 ? (
            <span>현재 기본 지도 뷰(조건 없이 전체 조회)</span>
          ) : (
            <>
              <span className="text-slate-400">지도 적용 필터</span>
              {activeBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {badge}
                </span>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-400">필터 패널이 접힌 상태입니다. 접기/펴기 버튼으로 열어주세요.</div>
      )}
    </section>
  );
}
