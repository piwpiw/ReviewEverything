import FilterBar from "@/components/FilterBar";
import SortBar from "@/components/SortBar";
import CampaignList from "@/components/CampaignList";
import ListSkeleton from "@/components/ListSkeleton";
import { Suspense } from "react";

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;
  const keyword = params?.q || '';
  const sort = params?.sort || 'latest_desc';

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-8 pb-32">
      {/* Hero Section */}
      <div className="flex flex-col gap-3 py-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-[100px] opacity-20 -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-purple-400 rounded-full blur-[80px] opacity-20 -z-10 animate-pulse delay-700"></div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800">
          당신을 위한 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">최적의 캠페인</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg">7개의 흩어진 플랫폼, 이제 한 곳에서 프리미엄하게 비교하세요.</p>
      </div>

      {/* Search & Filter Section */}
      <div className="flex flex-col gap-6 -mt-2">
        <form action="/" className="flex border-2 border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm bg-white">
          <input type="text" name="q" defaultValue={keyword} placeholder="어떤 캠페인을 찾으시나요? (강남역 맛집, 기초 화장품...)" className="w-full p-4 md:p-5 outline-none text-slate-700 text-lg" />
          {params?.platform_id && <input type="hidden" name="platform_id" value={params.platform_id} />}
          {params?.campaign_type && <input type="hidden" name="campaign_type" value={params.campaign_type} />}
          {params?.media_type && <input type="hidden" name="media_type" value={params.media_type} />}
          {params?.sort && <input type="hidden" name="sort" value={params.sort} />}
          <button type="submit" className="bg-slate-900 text-white px-8 md:px-12 font-bold text-lg hover:bg-blue-600 transition-colors">검색</button>
        </form>
        <FilterBar />
      </div>

      <div className="flex justify-end -mb-4">
        <SortBar currentSort={sort} />
      </div>

      {/* Streamed Campaign Content */}
      <Suspense key={JSON.stringify(params)} fallback={<ListSkeleton />}>
        <CampaignList searchParams={params as any} />
      </Suspense>
    </main>
  );
}
