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
import { LayoutGrid, List as ListIcon, Map as MapIcon, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "캠페인 허브 | 리뷰에브리띵",
  description: "플랫폼·유형·지역 기반 필터와 정렬로 캠페인을 빠르게 탐색하세요.",
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
    if (!value) return;
    params.set(key, value);
  });
  return params.toString();
};

const buildFilterSummary = (sp: SearchParams) => {
  const items = [
    { key: "q", label: `키워드: ${sp.q}` },
    { key: "platform_id", label: `플랫폼: ${sp.platform_id}` },
    { key: "campaign_type", label: `유형: ${sp.campaign_type}` },
    { key: "media_type", label: `매체: ${sp.media_type}` },
    { key: "region_depth1", label: `지역: ${sp.region_depth1}` },
    { key: "region_depth2", label: `세부지역: ${sp.region_depth2}` },
    { key: "category", label: `카테고리: ${sp.category}` },
  ] as const;

  return items.filter((item) => {
    const raw = item.label.split(":")[1]?.trim();
    return Boolean(raw);
  });
};

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const viewMode = sp.view === "map" ? "map" : "list";
  const layoutMode = sp.layout === "list" ? "list" : "card";
  const hasFilters = Boolean(
    sp.q || sp.platform_id || sp.campaign_type || sp.media_type || sp.region_depth1 || sp.region_depth2 || sp.category,
  );
  const activeFilters = buildFilterSummary(sp);
  const hasSortOnly = viewMode === "list" && !hasFilters && Boolean(sp.sort && sp.sort !== "latest_desc");
  const resetFiltersHref = hasSortOnly ? "/" : "/?sort=latest_desc";
  const mapPermissionDenied = sp.permission_denied === "1";

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-100/60 dark:border-slate-800/50">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-blue-50/80 via-indigo-50/20 to-transparent dark:from-blue-900/10 dark:via-indigo-900/5 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-[600px] h-[400px] bg-pink-200/20 dark:bg-fuchsia-900/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative max-w-[1700px] mx-auto px-4 md:px-8 pt-20 pb-14 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 shadow-2xl shadow-blue-900/5 mb-8 border border-slate-100 dark:border-slate-800 transition-all hover:scale-105">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-current" />
            </div>
            <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">ReviewEverything</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-[1.1] mb-5 text-slate-900 dark:text-white max-w-5xl mx-auto">
            리뷰 캠페인을 한 화면에서 촘촘하게 정리하고
            <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              카드와 리스트로 바로 전환해 운영하세요
            </span>
          </h1>
          <p className="max-w-3xl text-slate-500 dark:text-slate-400 text-base md:text-lg font-bold leading-relaxed mb-10">
            플랫폼·매체·유형·지역·카테고리 검색 후, 같은 데이터셋을 카드/리스트/지도에서 즉시 비교할 수 있습니다.
          </p>
          <p className="sr-only">status: search-ready</p>

          <div className="w-full max-w-2xl mx-auto mb-10 relative z-50">
            <Suspense>
              <HeroSearch defaultValue={sp.q || ""} />
            </Suspense>
          </div>

          <div className="w-full max-w-4xl mx-auto mb-8 relative z-40">
            <SearchGuidePanel />
          </div>

          <div className="relative z-40 w-full max-w-4xl mx-auto">
            <Suspense fallback={<div className="h-16 w-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-3xl" />}>
              <StatsBanner />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="max-w-[1700px] mx-auto px-4 md:px-8 py-7 flex flex-col gap-5">
        <h2 className="sr-only">탐색 제어와 결과</h2>
        <div className="relative z-20 lg:sticky lg:top-[64px] bg-background/95 backdrop-blur-xl -mx-4 px-4 py-2 border-b border-slate-100/50 dark:border-slate-800/50">
          <Suspense fallback={<div className="h-24 skeleton rounded-3xl w-full" />}>
            <FilterBar />
          </Suspense>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 px-1">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 rounded-2xl shadow-inner">
            <Link
              href={`/?${toSearchParams({ ...sp, view: "list", layout: layoutMode })}`}
              aria-label="목록 보기로 전환"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${viewMode === "list"
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${viewMode === "map"
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${layoutMode === "card"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400"
                  }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                카드
              </Link>
              <Link
                href={`/?${toSearchParams({ ...sp, view: "list", layout: "list" })}`}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${layoutMode === "list"
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
              <div className="hidden lg:flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-slate-200 dark:border-slate-800 pr-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{layoutMode === "list" ? "리스트 밀도 모드" : "카드 밀도 모드"}</span>
              </div>
            ) : null}
            <Suspense fallback={<div className="w-48 h-10 rounded-2xl skeleton" />}>
              <SortBar currentSort={sp.sort || "latest_desc"} />
            </Suspense>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="flex-1 md:flex-none px-1">
            <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">현재 선택 항목</p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {activeFilters.length === 0 ? (
                <span className="text-xs font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-full">
                  선택 조건 없음
                </span>
              ) : (
                <>
                  {activeFilters.map((item) => (
                    <span
                      key={item.key}
                      className="text-xs font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 whitespace-nowrap"
                    >
                      {item.label}
                    </span>
                  ))}
                  <Link
                    href={resetFiltersHref}
                    className="text-xs font-black text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 px-3 py-1.5 rounded-full border border-rose-200/70 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-900/20 whitespace-nowrap"
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
            <CampaignList searchParams={sp} viewMode={viewMode} layoutMode={layoutMode} />
          </Suspense>
        </div>

        {!hasFilters ? (
          <div className="mt-10 py-14 text-center relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[80px]" />
            <div className="relative z-10 px-4">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                카드와 리스트를 함께 보며 캠페인 탐색을 시작하세요.
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed">
                결과가 없으면 필터를 조정하고, 같은 데이터셋을 리스트 모드에서 비교해 우선순위를 빠르게 정리할 수 있습니다.
              </p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

