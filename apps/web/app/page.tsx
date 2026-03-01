import { Suspense } from "react";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import SortBar from "@/components/SortBar";
import CampaignList from "@/components/CampaignList";
import ListSkeleton from "@/components/ListSkeleton";
import HeroSearch from "@/components/HeroSearch";
import StatsBanner from "@/components/StatsBanner";
import { Sparkles, Map as MapIcon, LayoutGrid } from "lucide-react";

export default async function Home({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const viewMode = sp.view || "list";
  const hasFilters = Boolean(sp.q || sp.platform_id || sp.campaign_type || sp.media_type || sp.region_depth1 || sp.category);

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* ── Moaview Phase 2 Hero Hub ── */}
      {!hasFilters && (
        <div className="relative overflow-hidden bg-white dark:bg-slate-950 border-b border-slate-100/60 dark:border-slate-800/50">
          {/* Advanced Geometric Background Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/30 dark:from-blue-900/10 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-100/20 dark:bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative max-w-[1700px] mx-auto px-4 md:px-8 pt-16 pb-14 flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-slate-900 dark:bg-blue-600 shadow-2xl shadow-slate-900/10 mb-8 border border-white/10 transition-colors">
              <Sparkles className="w-4 h-4 text-amber-400 fill-current" />
              <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Next-Generation Curation Module</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] leading-[1.05] mb-6 text-slate-900 dark:text-white">
              원하는 캠페인,<br />
              <span className="text-blue-600 dark:text-blue-400">1초 만에</span> 찾아내기
            </h1>

            <p className="max-w-xl text-slate-500 dark:text-slate-400 text-lg font-bold leading-relaxed mb-12">
              국내 7대 플랫폼의 모든 데이터를 초정밀 필터로 분석합니다.<br />
              모아뷰 2.0의 지능형 엔진으로 당신의 당첨 확률을 극대화하세요.
            </p>

            {/* Centered Search Discovery Hub */}
            <div className="w-full max-w-2xl mx-auto mb-16">
              <Suspense>
                <HeroSearch defaultValue={sp.q || ""} />
              </Suspense>
            </div>

            {/* Live Data Pulse */}
            <Suspense fallback={<div className="h-16 w-full skeleton rounded-3xl" />}>
              <StatsBanner />
            </Suspense>
          </div>
        </div>
      )}

      {/* ── Main Data Exploration Logic ── */}
      <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-10 flex flex-col gap-8">

        {/* Sticky Moaview Filter Panel */}
        <div className="sticky top-[64px] z-50 bg-background/80 backdrop-blur-xl -mx-4 px-4 py-2 border-b border-slate-100/50 dark:border-slate-800/50">
          <Suspense fallback={<div className="h-24 skeleton rounded-[2.5rem] w-full" />}>
            <FilterBar />
          </Suspense>
        </div>

        {/* Tools & Sort Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-1">
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-inner">
            <Link
              href={`/?${new URLSearchParams({ ...sp, view: 'list' }).toString()}`}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl shadow-slate-900/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              목록 그리드
            </Link>
            <Link
              href={`/?${new URLSearchParams({ ...sp, view: 'map' }).toString()}`}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all ${viewMode === 'map' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl shadow-slate-900/5' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              현위치 지도필터
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-r border-slate-200 dark:border-slate-800 pr-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Engine Sync Active
            </div>
            <Suspense fallback={<div className="w-48 h-10 skeleton rounded-2xl" />}>
              <SortBar currentSort={sp.sort || "latest_desc"} />
            </Suspense>
          </div>
        </div>

        {/* Data Stream */}
        <div className="relative">
          <Suspense fallback={<ListSkeleton />}>
            <CampaignList searchParams={sp} viewMode={viewMode} />
          </Suspense>
        </div>

        {/* Footer Area Nudge */}
        {!hasFilters && (
          <div className="mt-20 py-20 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[2rem] bg-slate-100 dark:bg-slate-900 mb-6 text-slate-400 dark:text-slate-600 transition-colors">
              <MapIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 italic uppercase">Ready for your next Review?</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-bold">당신에게 가장 가까운, 가장 보상이 큰 캠페인을 지금 바로 확인하세요.</p>
          </div>
        )}
      </div>
    </main>
  );
}
