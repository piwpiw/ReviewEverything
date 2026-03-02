import { Suspense } from "react";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import SortBar from "@/components/SortBar";
import CampaignList from "@/components/CampaignList";
import ListSkeleton from "@/components/ListSkeleton";
import HeroSearch from "@/components/HeroSearch";
import StatsBanner from "@/components/StatsBanner";
import { Sparkles, Map as MapIcon, LayoutGrid } from "lucide-react";

type SearchParams = {
  q?: string;
  platform_id?: string;
  campaign_type?: string;
  media_type?: string;
  region_depth1?: string;
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

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const viewMode = sp.view === "map" ? "map" : "list";
  const hasFilters = Boolean(sp.q || sp.platform_id || sp.campaign_type || sp.media_type || sp.region_depth1 || sp.category);

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="relative overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-100/60 dark:border-slate-800/50">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />
        <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-blue-50/80 via-indigo-50/20 to-transparent dark:from-blue-900/10 dark:via-indigo-900/5 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-indigo-200/30 dark:bg-blue-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
        <div className="absolute bottom-0 right-32 w-[600px] h-[400px] bg-pink-200/20 dark:bg-fuchsia-900/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="relative max-w-[1700px] mx-auto px-4 md:px-8 pt-24 pb-20 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 shadow-2xl shadow-blue-900/5 mb-8 border border-slate-100 dark:border-slate-800 transition-all hover:scale-105 cursor-default hover:shadow-blue-500/10">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 fill-current" />
            </div>
            <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">ReviewEverything Engine v2.0</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6 text-slate-900 dark:text-white max-w-4xl mx-auto drop-shadow-sm">
            최고의 캠페인을 가장 먼저, <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">압도적인 속도로.</span>
          </h1>

          <p className="max-w-2xl text-slate-500 dark:text-slate-400 text-lg md:text-xl font-bold leading-relaxed mb-12">
            실시간 트렌드 분석부터 AI 기반 보상 가치 산출, 자동화된 D-day 알림까지. <br className="hidden md:block" /> 비교할 수 없는 리뷰어 중심 시스템을 경험하세요.
          </p>

          <div className="w-full max-w-2xl mx-auto mb-16 relative z-50">
            <Suspense>
              <HeroSearch defaultValue={sp.q || ""} />
            </Suspense>
          </div>

          <div className="relative z-40 w-full max-w-4xl mx-auto">
            <Suspense fallback={<div className="h-16 w-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-[2rem]" />}>
              <StatsBanner />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-10 flex flex-col gap-8">
        <div className="sticky top-[64px] z-50 bg-background/80 backdrop-blur-xl -mx-4 px-4 py-2 border-b border-slate-100/50 dark:border-slate-800/50">
          <Suspense fallback={<div className="h-24 skeleton rounded-[2.5rem] w-full" />}>
            <FilterBar />
          </Suspense>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-1">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-inner">
            <Link
              href={`/?${toSearchParams({ ...sp, view: "list" })}`}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === "list" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl shadow-slate-900/5" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              목록 보기
            </Link>
            <Link
              href={`/?${toSearchParams({ ...sp, view: "map" })}`}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === "map" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl shadow-slate-900/5" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              지도 보기
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-slate-200 dark:border-slate-800 pr-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              캠페인 동기화 활성
            </div>
            <Suspense fallback={<div className="w-48 h-10 skeleton rounded-2xl" />}>
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
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">당신의 다음 캠페인을 발굴하세요</h3>
              <p className="text-base text-slate-500 dark:text-slate-400 font-bold max-w-xl mx-auto leading-relaxed">
                필터를 조합하거나 상단 검색창을 활용해 나에게 딱 맞는 캠페인을 순식간에 찾아낼 수 있습니다. <br className="hidden md:block" />
                지도를 통해 주변 맛집부터 핫플까지 놓치지 마세요.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
