import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import SortBar from "@/components/SortBar";
import CampaignList from "@/components/CampaignList";
import ListSkeleton from "@/components/ListSkeleton";
import HeroSearch from "@/components/HeroSearch";
import StatsBanner from "@/components/StatsBanner";

export default async function Home({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const viewMode = sp.view || "list";
  const hasFilters = Boolean(sp.q || sp.platform_id || sp.campaign_type || sp.media_type);

  return (
    <main className="min-h-screen">
      {/* ── Hero ── */}
      {!hasFilters && (
        <div className="relative overflow-hidden bg-white border-b border-slate-100">
          {/* Ambient blobs */}
          <div className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-[80px]" />

          <div className="relative max-w-[1600px] mx-auto px-4 md:px-8 pt-14 pb-12">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">실시간 자동 수집 · 국내 7대 플랫폼</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black tracking-[-0.04em] leading-[1.05] mb-5 text-gradient">
                체험단의 모든 것,<br />한 곳에서
              </h1>
              <p className="text-slate-500 text-base font-medium leading-relaxed mb-10 max-w-xl">
                레뷰, 리뷰노트, 디너의여왕 등 7개 플랫폼 데이터를 실시간으로 수집합니다.<br />
                방문형·배송형·블로그·인스타까지 한 번에 탐색하세요.
              </p>

              {/* Search */}
              <Suspense>
                <HeroSearch defaultValue={sp.q || ""} />
              </Suspense>
            </div>

            {/* Live Stats Row */}
            <Suspense fallback={<div className="h-16 mt-10 skeleton rounded-2xl" />}>
              <StatsBanner />
            </Suspense>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        {/* Sticky Filter Bar */}
        <div className="sticky top-[60px] z-50 pb-4">
          <Suspense fallback={<div className="h-[90px] skeleton rounded-[2rem] w-full" />}>
            <FilterBar />
          </Suspense>
        </div>

        {/* Sort Row + View Toggle */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 px-1">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <form action="/" method="GET">
              {Object.entries(sp).filter(([k]) => k !== "view").map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v as string} />
              ))}
              <button name="view" value="list" className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                목록형
              </button>
            </form>
            <form action="/" method="GET">
              {Object.entries(sp).filter(([k]) => k !== "view").map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v as string} />
              ))}
              <button name="view" value="map" className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 ${viewMode === "map" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                지도형
              </button>
            </form>
          </div>

          <Suspense fallback={<div className="w-40 h-9 skeleton rounded-xl" />}>
            <SortBar currentSort={sp.sort || "latest_desc"} />
          </Suspense>
        </div>

        {/* List or Map */}
        <Suspense fallback={<ListSkeleton />}>
          <CampaignList searchParams={sp} viewMode={viewMode} />
        </Suspense>
      </div>
    </main>
  );
}
