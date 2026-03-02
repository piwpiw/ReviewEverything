import { Suspense } from "react";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import SortBar from "@/components/SortBar";
import CampaignList from "@/components/CampaignList";
import ListSkeleton from "@/components/ListSkeleton";
import HeroSearch from "@/components/HeroSearch";
import StatsBanner from "@/components/StatsBanner";
import SearchGuidePanel from "@/components/SearchGuidePanel";
import { LayoutGrid, Map as MapIcon, Sparkles } from "lucide-react";

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
  const hasFilters = Boolean(
    sp.q || sp.platform_id || sp.campaign_type || sp.media_type || sp.region_depth1 || sp.region_depth2 || sp.category,
  );
  const activeFilters = buildFilterSummary(sp);

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="relative overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-100/60 dark:border-slate-800/50">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-blue-50/80 via-indigo-50/20 to-transparent dark:from-blue-900/10 dark:via-indigo-900/5 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-[600px] h-[400px] bg-pink-200/20 dark:bg-fuchsia-900/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative max-w-[1700px] mx-auto px-4 md:px-8 pt-24 pb-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 shadow-2xl shadow-blue-900/5 mb-8 border border-slate-100 dark:border-slate-800 transition-all hover:scale-105 cursor-default hover:shadow-blue-500/10">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-current" />
            </div>
            <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">ReviewEverything</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6 text-slate-900 dark:text-white max-w-4xl mx-auto drop-shadow-sm">
            리뷰에브리띵으로 모든 리뷰를 한눈에 정리하고 운영까지 한 번에 관리하세요
            <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              원클릭 정리, 링크 추적, 지도 확인까지 한 번에
            </span>
          </h1>
          <p className="max-w-2xl text-slate-500 dark:text-slate-400 text-lg md:text-xl font-bold leading-relaxed mb-12">
            플랫폼·매체·유형·지역·카테고리별로 캠페인을 빠르게 찾고, 정확한 링크를 바로 확인하세요.
            <br className="hidden md:block" />
            지도에서 위치를 확인하고 핵심 수치로 우선순위를 판단해 운영 효율을 높입니다.
          </p>

          <div className="w-full max-w-2xl mx-auto mb-16 relative z-50">
            <Suspense>
              <HeroSearch defaultValue={sp.q || ""} />
            </Suspense>
          </div>

          <div className="w-full max-w-4xl mx-auto mb-10 relative z-40">
            <SearchGuidePanel />
          </div>

          <div className="relative z-40 w-full max-w-4xl mx-auto">
            <Suspense fallback={<div className="h-16 w-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-[2rem]" />}>
              <StatsBanner />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-10 flex flex-col gap-8">
        <div className="relative z-20 lg:sticky lg:top-[64px] bg-background/95 backdrop-blur-xl -mx-4 px-4 py-2 border-b border-slate-100/50 dark:border-slate-800/50">
          <Suspense fallback={<div className="h-24 skeleton rounded-[2.5rem] w-full" />}>
            <FilterBar />
          </Suspense>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-1">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-inner">
            <Link
              href={`/?${toSearchParams({ ...sp, view: "list" })}`}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl shadow-slate-900/5"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              목록 보기
            </Link>
            <Link
              href={`/map?${toSearchParams({ ...sp, view: "map", campaign_type: sp.campaign_type || "VST" })}`}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-black transition-all ${
                viewMode === "map"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl shadow-slate-900/5"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              지도 보기
            </Link>
          </div>

          {viewMode === "list" ? (
            <div className="flex-1 md:flex-none">
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                현재 선택 항목
              </p>
              <div className="flex items-center gap-2 overflow-x-auto">
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
                      href="/?sort=latest_desc"
                      className="text-xs font-black text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300 px-3 py-1.5 rounded-full border border-rose-200/70 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-900/20 whitespace-nowrap"
                    >
                      정렬 초기화
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-slate-200 dark:border-slate-800 pr-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>실시간 정렬</span>
            </div>
            <Suspense fallback={<div className="w-48 h-10 rounded-2xl skeleton" />}>
              <SortBar currentSort={sp.sort || "latest_desc"} />
            </Suspense>
          </div>
        </div>

        <div className="relative">
          <Suspense fallback={<ListSkeleton />}>
            <CampaignList searchParams={sp} viewMode={viewMode} />
          </Suspense>
        </div>

        {!hasFilters && (
          <div className="mt-20 py-24 text-center relative overflow-hidden rounded-[3rem] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-950 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-900/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[80px]" />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white dark:bg-slate-900 mb-8 text-blue-500 dark:text-blue-400 shadow-2xl shadow-blue-900/10 transition-transform hover:scale-110 duration-500">
                <MapIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                지도를 통한 캠페인 탐색을 시작하세요.
              </h3>
              <p className="text-base text-slate-500 dark:text-slate-400 font-bold max-w-xl mx-auto leading-relaxed">
                검색 결과가 없을 때는 필터를 조정하거나 지도를 다시 확인하세요.
                지도와 목록을 함께 보며 빠르게 운영 우선순위를 판단할 수 있습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

