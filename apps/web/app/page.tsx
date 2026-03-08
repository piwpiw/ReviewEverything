import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import SortBar from "@/components/SortBar";
import CampaignList from "@/components/CampaignList";
import ListSkeleton from "@/components/ListSkeleton";
import HeroSearch from "@/components/HeroSearch";
import StatsBanner from "@/components/StatsBanner";
import SearchGuidePanel from "@/components/SearchGuidePanel";
import { formatFilterValue } from "@/lib/filterDisplay";
import { normalizeSearchParamValue } from "@/lib/searchParams";
import { getCampaigns } from "@/lib/data/campaigns";
import { LayoutGrid, List as ListIcon, Map as MapIcon, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "체험단 통합 조회 | 리뷰에브리띵",
  description: "운영 중인 체험단 캠페인을 플랫폼별로 모아 빠르게 조회하고 비교하세요.",
  alternates: {
    canonical: "/",
  },
};
type SearchParams = {
  q?: string;
  platform_id?: string;
  campaign_type?: string;
  media_type?: string;
  region_depth1?: string;
  region_depth2?: string;
  category?: string;
  sort?: string;
  view?: "list" | "map";
  layout?: "card" | "list";
  permission_denied?: string;
};

const toSearchParams = (source: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(source).forEach(([key, value]) => {
    const normalized = normalizeSearchParamValue(value);
    if (!normalized) return;
    params.set(key, normalized);
  });
  return params.toString();
};

const buildHomeHref = (source: Record<string, string | undefined>) => {
  const query = toSearchParams(source);
  return query ? `/?${query}` : "/";
};

const buildFilterSummary = (sp: SearchParams) => {
  const items = [
    { key: "q", prefix: "키워드", value: normalizeSearchParamValue(sp.q) },
    { key: "platform_id", prefix: "플랫폼", value: normalizeSearchParamValue(sp.platform_id) },
    { key: "campaign_type", prefix: "유형", value: normalizeSearchParamValue(sp.campaign_type) },
    { key: "media_type", prefix: "매체", value: normalizeSearchParamValue(sp.media_type) },
    { key: "region_depth1", prefix: "지역", value: normalizeSearchParamValue(sp.region_depth1) },
    { key: "region_depth2", prefix: "세부지역", value: normalizeSearchParamValue(sp.region_depth2) },
    { key: "category", prefix: "카테고리", value: normalizeSearchParamValue(sp.category) },
  ] as const;

  return items
    .filter((item) => Boolean(item.value))
    .map((item) => ({ key: item.key, label: `${item.prefix}: ${formatFilterValue(item.key, item.value || "")}` }));
};

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const rawSearchParams = await searchParams;
  const sp: SearchParams = {
    ...rawSearchParams,
    q: normalizeSearchParamValue(rawSearchParams.q),
    platform_id: normalizeSearchParamValue(rawSearchParams.platform_id),
    campaign_type: normalizeSearchParamValue(rawSearchParams.campaign_type),
    media_type: normalizeSearchParamValue(rawSearchParams.media_type),
    region_depth1: normalizeSearchParamValue(rawSearchParams.region_depth1),
    region_depth2: normalizeSearchParamValue(rawSearchParams.region_depth2),
    category: normalizeSearchParamValue(rawSearchParams.category),
    sort: normalizeSearchParamValue(rawSearchParams.sort),
    view: rawSearchParams.view === "map" ? "map" : "list",
    layout: rawSearchParams.layout === "list" ? "list" : "card",
    permission_denied: normalizeSearchParamValue(rawSearchParams.permission_denied),
  };
  const viewMode = sp.view === "map" ? "map" : "list";
  const layoutMode = sp.layout === "list" ? "list" : "card";
  const hasFilters = Boolean(
    sp.q || sp.platform_id || sp.campaign_type || sp.media_type || sp.region_depth1 || sp.region_depth2 || sp.category,
  );
  const activeFilters = buildFilterSummary(sp);
  const hasSortOnly = viewMode === "list" && !hasFilters && Boolean(sp.sort && sp.sort !== "latest_desc");
  const resetFiltersHref = hasSortOnly
    ? buildHomeHref({ view: sp.view, layout: sp.layout })
    : buildHomeHref({ view: sp.view, layout: sp.layout, sort: sp.sort });
  const mapPermissionDenied = sp.permission_denied === "1";

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-100/60 dark:border-slate-800/50">
        <div className="absolute inset-0 pointer-events-none opacity-[0.08] [background-image:radial-gradient(rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/40 via-transparent pointer-events-none dark:from-blue-900/5" />

        <div className="relative max-w-[1700px] mx-auto px-4 md:px-8 pt-6 pb-5 flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-2 text-slate-900 dark:text-white max-w-4xl mx-auto">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              모든 체험단을 한눈에, 리뷰에브리띵
            </span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium mb-5">
            플랫폼별로 흩어진 체험단 소식, 이제 여기서 한 번에 찾으세요!
          </p>

          <div className="w-full max-w-2xl mx-auto mb-6 relative z-50">
            <Suspense>
              <HeroSearch defaultValue={sp.q || ""} />
            </Suspense>
          </div>

          <div className="w-full max-w-4xl mx-auto mb-5 relative z-40">
            <SearchGuidePanel />
          </div>

          <div className="relative z-40 w-full max-w-4xl mx-auto">
            <Suspense fallback={<div className="h-16 w-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl" />}>
              <StatsBanner />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="max-w-[1700px] mx-auto px-4 md:px-8 py-5 flex flex-col gap-4">
        <h2 className="sr-only">탐색 제어와 결과</h2>
        <div className="relative z-20 lg:sticky lg:top-[64px] bg-background/95 backdrop-blur-xl -mx-4 px-4 py-1.5 border-b border-slate-100/50 dark:border-slate-800/50">
          <Suspense fallback={<div className="h-24 skeleton rounded-3xl w-full" />}>
            <FilterBar />
          </Suspense>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 px-1">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-inner">
            <Link
              href={`/?${toSearchParams({ ...sp, view: "list", layout: layoutMode })}`}
              aria-label="목록 보기로 전환"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${viewMode === "list"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              목록
            </Link>
            <Link
              href={`/map?${toSearchParams({ ...sp, view: "map", campaign_type: sp.campaign_type || "VST" })}`}
              aria-label="지도 보기로 전환"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${viewMode === "map"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              지도
            </Link>
          </div>

          {viewMode === "list" ? (
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
              <Link
                href={`/?${toSearchParams({ ...sp, view: "list", layout: "card" })}`}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-black inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${layoutMode === "card"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                카드
              </Link>
              <Link
                href={`/?${toSearchParams({ ...sp, view: "list", layout: "list" })}`}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-black inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${layoutMode === "list"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400"
                  }`}
              >
                <ListIcon className="w-3.5 h-3.5" />
                리스트
              </Link>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            {viewMode === "list" ? (
              <div className="hidden lg:flex items-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-slate-200 dark:border-slate-800 pr-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{layoutMode === "list" ? "리스트 보기" : "카드 보기"}</span>
              </div>
            ) : null}
            <Suspense fallback={<div className="w-48 h-10 rounded-2xl skeleton" />}>
              <SortBar currentSort={sp.sort || "latest_desc"} />
            </Suspense>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="flex-1 md:flex-none px-1">
            <p className="text-xs md:text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">지금 적용 중인 필터</p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {activeFilters.length === 0 ? (
                <span className="text-sm font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                  적용된 필터가 없어요
                </span>
              ) : (
                <>
                  {activeFilters.map((item) => (
                    <span
                      key={item.key}
                      className="text-sm font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                    >
                      {item.label}
                    </span>
                  ))}
                  <Link
                    href={resetFiltersHref}
                    className="text-sm font-black text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 px-3 py-1.5 rounded-full border border-rose-200/70 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-900/20 whitespace-nowrap"
                  >
                    {hasSortOnly ? "정렬 초기화" : "필터 초기화"}
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="relative">
          {mapPermissionDenied ? (
            <div className="mb-4 rounded-xl border border-amber-300/40 bg-amber-100/40 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 text-sm px-4 py-3">
              지도 권한이 거부되어 대체 흐름으로 이동했습니다. 목록 보기에서 필터를 확인한 뒤 다시 지도 모드를 열어보세요.
              <Link href={`/?${toSearchParams({ ...sp, view: "list", layout: layoutMode })}`} className="ml-2 underline font-black">
                목록으로 전환
              </Link>
            </div>
          ) : null}
          <Suspense fallback={<ListSkeleton layoutMode={layoutMode} />}>
            <CampaignFetchWrapper searchParams={sp} viewMode={viewMode} layoutMode={layoutMode} />
          </Suspense>
        </div>

        {!hasFilters ? (
          <div className="mt-10 py-14 text-center relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[80px]" />
            <div className="relative z-10 px-4">
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                나에게 꼭 맞는 체험단을 찾아보세요!
              </h3>
              <p className="text-base text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed">
                지역과 카테고리를 선택하면 원하는 보상과 경쟁률에 맞춰<br className="hidden md:block" /> 꼭 참여하고 싶은 캠페인만 모아볼 수 있습니다.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

async function CampaignFetchWrapper({
  searchParams,
  viewMode,
  layoutMode,
}: {
  searchParams: SearchParams;
  viewMode: string;
  layoutMode: "card" | "list";
}) {
  const fetchParams = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => v && fetchParams.set(k, String(v)));

  const initialData = await getCampaigns(fetchParams);

  return (
    <CampaignList
      searchParams={searchParams as any}
      viewMode={viewMode}
      layoutMode={layoutMode}
      initialData={initialData as any}
    />
  );
}
