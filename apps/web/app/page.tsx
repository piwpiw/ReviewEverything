import FilterBar from "@/components/FilterBar";
import SortBar from "@/components/SortBar";
import CampaignCard from "@/components/CampaignCard";

// Mock Database wrapper to allow immediate rendering without Postgres
const MOCK_CAMPAIGNS = [
  { id: 1, title: "[강남] 최고급 프리미엄 오마카세 2인 식사권", location: "서울 강남구", media_type: "IP", campaign_type: "VST", platform: { name: "Revu", id: 1 }, thumbnail_url: "https://images.unsplash.com/photo-1544025162-831518f8887b?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 5, applicant_count: 2, competition_rate: 0.4 }] },
  { id: 2, title: "신제품 무소음 무접점 기계식 키보드 풀세트 증정", location: "지역 무관", media_type: "BP", campaign_type: "SHP", platform: { name: "Reviewnote", id: 2 }, thumbnail_url: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 10, applicant_count: 120, competition_rate: 12.0 }] },
  { id: 3, title: "성수동 핫플 카페 시그니처 디저트 세트 (웨이팅 프리 패스)", location: "서울 성동구", media_type: "IP", campaign_type: "VST", platform: { name: "DinnerQueen", id: 3 }, thumbnail_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 3, applicant_count: 1, competition_rate: 0.3 }] },
  { id: 4, title: "기초 화장품 스킨케어 3종 세트 협찬", location: "지역 무관", media_type: "YP", campaign_type: "SHP", platform: { name: "Seouloppa", id: 4 }, thumbnail_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 20, applicant_count: 15, competition_rate: 0.75 }] },
  { id: 5, title: "[기자단] 아이폰 16 케이스 리뷰 단가 5만원 지급", location: "온라인", media_type: "BP", campaign_type: "PRS", platform: { name: "Revu", id: 1 }, thumbnail_url: "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 50, applicant_count: 10, competition_rate: 0.2 }] }
];

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
  const params = await searchParams; // Wait for search params in App Router Server Components
  const sort = params?.sort || 'latest_desc';
  const keyword = params?.q?.toLowerCase() || '';
  const platformId = params?.platform_id;
  const campaignType = params?.campaign_type;
  const mediaType = params?.media_type;

  // Real-time server side mock filtering
  let filtered = MOCK_CAMPAIGNS.filter(c => {
    if (keyword && !c.title.toLowerCase().includes(keyword) && !c.location.toLowerCase().includes(keyword)) return false;
    if (platformId && c.platform.id.toString() !== platformId) return false;
    if (campaignType && c.campaign_type !== campaignType) return false;
    if (mediaType && c.media_type !== mediaType) return false;
    return true;
  });

  // Dynamic Sort
  if (sort === "competition_asc") {
    filtered = filtered.sort((a, b) => a.snapshots[0].competition_rate - b.snapshots[0].competition_rate);
  } else if (sort === "deadline_asc") {
    // Mock sorting for deadline, reversing array as placeholder
    filtered = filtered.reverse();
  } else {
    filtered = filtered.sort((a, b) => a.id - b.id);
  }

  return (
    <main className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-8 pb-32">
      <div className="flex flex-col gap-3 py-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-[100px] opacity-20 -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-purple-400 rounded-full blur-[80px] opacity-20 -z-10 animate-pulse delay-700"></div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-800">
          당신을 위한 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">최적의 캠페인</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg">7개의 흩어진 플랫폼, 이제 한 곳에서 프리미엄하게 비교하세요.</p>
      </div>

      <div className="flex flex-col gap-6 -mt-2">
        <form action="/" className="flex border-2 border-slate-200 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm bg-white">
          <input type="text" name="q" defaultValue={keyword} placeholder="어떤 캠페인을 찾으시나요? (강남역 맛집, 기초 화장품...)" className="w-full p-4 md:p-5 outline-none text-slate-700 text-lg" />
          {/* Preserve other filters on search */}
          {platformId && <input type="hidden" name="platform_id" value={platformId} />}
          {campaignType && <input type="hidden" name="campaign_type" value={campaignType} />}
          {mediaType && <input type="hidden" name="media_type" value={mediaType} />}
          {params?.sort && <input type="hidden" name="sort" value={params.sort} />}
          <button type="submit" className="bg-slate-900 text-white px-8 md:px-12 font-bold text-lg hover:bg-blue-600 transition-colors">검색</button>
        </form>
        <FilterBar />
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-end mb-6">
          <div className="font-bold text-slate-700 text-lg">총 <span className="text-blue-600">{filtered.length}</span>개의 캠페인</div>
          <SortBar currentSort={sort} />
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="text-slate-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-1">조건에 맞는 캠페인이 없습니다</h3>
            <p className="text-slate-500">필터를 변경하거나 검색어를 수정해보세요.</p>
          </div>
        )}
      </div>
    </main>
  );
}
