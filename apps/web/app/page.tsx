import { Suspense } from "react";
import FilterBar from "@/components/FilterBar";
import SortBar from "@/components/SortBar";
import CampaignList from "@/components/CampaignList";
import ListSkeleton from "@/components/ListSkeleton";
import { Search, Sparkles, Map as MapIcon, List as ListIcon } from "lucide-react";

export default async function Home({ searchParams }: { searchParams: Promise<any> }) {
  const sp = await searchParams;
  const viewMode = sp.view || "list";

  return (
    <main className="min-h-screen bg-[#fafafa]">
      {/* --- Premium Animated Hero Section --- */}
      <div className="relative pt-24 pb-16 overflow-hidden border-b border-slate-100 bg-white">
        {/* Background Blobs - Subtle */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-[10px] font-black text-blue-700 tracking-tight uppercase">대한민국 7대 플랫폼 통합 탐색기</span>
              </div>

              <h1 className="text-[3.5rem] md:text-[4.5rem] font-black text-slate-900 leading-[1.1] tracking-[-0.04em] mb-6">
                체험단의 <span className="text-blue-600">모든 것</span>을<br />한눈에 확인하세요.
              </h1>

              <p className="max-w-xl text-md text-slate-500 font-medium leading-relaxed">
                레뷰, 리뷰노트, 디너의여왕 등 국내 주요 7개 체험단 사이트의 데이터를 실시간으로 수집하고 분석하여 고효율 캠페인을 선별해 드립니다.
              </p>
            </div>

            {/* Elite Search Interface - Denser */}
            <div className="w-full md:w-[450px] relative group">
              <form action="/" method="GET" className="relative z-10">
                <input
                  type="text"
                  name="q"
                  defaultValue={sp.q || ""}
                  placeholder="맛집, 상품, 키워드로 검색..."
                  className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border border-slate-200 text-md font-semibold outline-none focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Search className="w-6 h-6" />
                </div>
                <button type="submit" className="hidden">Search</button>
              </form>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {['#성수맛집', '#화장품', '#인스타협찬', '#블로그배송'].map(tag => (
                  <span key={tag} className="text-[11px] font-bold text-slate-400 hover:text-blue-600 cursor-pointer whitespace-nowrap">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="max-w-[1440px] mx-auto px-6 pb-40 mt-8">
        {/* Glass Sticky Navigation */}
        <div className="sticky top-6 z-50 mb-10">
          <Suspense fallback={<div className="h-24 bg-white/50 animate-pulse rounded-[2rem]" />}>
            <FilterBar />
          </Suspense>
        </div>

        <div className="flex flex-col gap-8">
          {/* List/Map Toggle & Sort */}
          <div className="flex flex-wrap justify-between items-center gap-4 px-2">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <form action="/" method="GET" className="flex items-center gap-1">
                {/* Preserve existing filters */}
                {Object.entries(sp).map(([k, v]) => k !== 'view' && <input key={k} type="hidden" name={k} value={v as string} />)}

                <button
                  name="view" value="list"
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  목록형
                </button>
                <button
                  name="view" value="map"
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  지도형
                </button>
              </form>
            </div>

            <Suspense fallback={<div className="w-32 h-10 bg-slate-100 rounded-2xl" />}>
              <SortBar currentSort={sp.sort || "latest_desc"} />
            </Suspense>
          </div>

          <Suspense fallback={<ListSkeleton />}>
            <CampaignList searchParams={sp} />
          </Suspense>
        </div>
      </div>

      <footer className="py-12 border-t border-slate-100 text-center bg-white">
        <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase">
          &copy; 2025 ReviewEverything All Rights Reserved.
        </p>
      </footer>
    </main>
  );
}
