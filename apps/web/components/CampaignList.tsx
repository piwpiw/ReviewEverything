import { db } from "@/lib/db";
import { buildCampaignsQuery } from "@/lib/queryBuilder";
import { getTrendingCampaigns } from "@/lib/analytics";
import CampaignCard from "./CampaignCard";

const MOCK_CAMPAIGNS = [
    { id: 1, title: "[리뷰] 샘플 캠페인 1", location: "서울 강남", media_type: "IP", campaign_type: "VST", platform: { name: "Revu", id: 1 }, thumbnail_url: "https://images.unsplash.com/photo-1544025162-831518f8887b?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 5, applicant_count: 2, competition_rate: 0.4 }] },
    { id: 2, title: "샘플 리뷰 포인트 캠페인", location: "서울 홍대", media_type: "BP", campaign_type: "SHP", platform: { name: "Reviewnote", id: 2 }, thumbnail_url: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 10, applicant_count: 120, competition_rate: 12.0 }] },
    { id: 3, title: "샘플 제품 체험 캠페인", location: "부산 해운대", media_type: "IP", campaign_type: "VST", platform: { name: "DinnerQueen", id: 3 }, thumbnail_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 3, applicant_count: 1, competition_rate: 0.3 }] },
    { id: 4, title: "샘플 핫한 모집 공고", location: "서울 마포", media_type: "YP", campaign_type: "SHP", platform: { name: "Seouloppa", id: 4 }, thumbnail_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 20, applicant_count: 15, competition_rate: 0.75 }] },
    { id: 5, title: "샘플 브랜드 캠페인", location: "서울 종로", media_type: "BP", campaign_type: "PRS", platform: { name: "ReviewPlace", id: 4 }, thumbnail_url: "https://images.unsplash.com/photo-1603313011101-320f26a4f6f6?auto=format&fit=crop&q=80&w=600", snapshots: [{ recruit_count: 50, applicant_count: 10, competition_rate: 0.2 }] }
];

export default async function CampaignList({ searchParams }: { searchParams: { [key: string]: string | undefined } }) {
    const keyword = searchParams?.q?.toLowerCase() || '';
    const platformId = searchParams?.platform_id;
    const campaignType = searchParams?.campaign_type;
    const mediaType = searchParams?.media_type;
    const isFiltered = Boolean(keyword || platformId || campaignType || mediaType);

    let filtered: any[] = [];
    let trending: any[] = [];
    let dataMode: 'ok' | 'empty' | 'unavailable' = 'ok';

    try {
        const qb = buildCampaignsQuery(new URLSearchParams(searchParams as any));
        const toCompetitionRate = (campaign: any) => {
            const latest = campaign.snapshots?.[0];
            if (!latest) return Number.POSITIVE_INFINITY;
            const parsed = Number(latest.competition_rate);
            if (Number.isFinite(parsed)) return parsed;
            return latest.applicant_count / (latest.recruit_count || 1);
        };

        if (qb.sort === 'competition_asc') {
            const [all, trendData] = await Promise.all([
                db.campaign.findMany({
                    where: qb.where,
                    orderBy: { created_at: 'desc' },
                    include: { platform: true, snapshots: { orderBy: { scraped_at: 'desc' }, take: 1 } }
                }),
                getTrendingCampaigns(4)
            ]);
            filtered = all.sort((a, b) => toCompetitionRate(a) - toCompetitionRate(b)).slice(qb.skip, qb.skip + qb.limit);
            trending = trendData;
        } else {
            [filtered, trending] = await Promise.all([
                db.campaign.findMany({
                    where: qb.where,
                    orderBy: qb.orderBy as any,
                    skip: qb.skip,
                    take: qb.take,
                    include: { platform: true, snapshots: { orderBy: { scraped_at: 'desc' }, take: 1 } }
                }),
                getTrendingCampaigns(4)
            ]);
        }
    } catch (error) {
        console.error("Database connection failed, falling back to mock data.", error);
        dataMode = 'unavailable';
        filtered = MOCK_CAMPAIGNS;
        trending = MOCK_CAMPAIGNS.slice(0, 4);
    }

    if (dataMode === 'ok' && !isFiltered && filtered.length === 0) {
        dataMode = 'empty';
    }

    return (
        <div className="flex flex-col gap-8">
            {dataMode === 'unavailable' ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm font-bold">
                    DB 연결이 불안정해 Mock 데이터로 표시 중입니다.
                </div>
            ) : null}

            {dataMode === 'empty' ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 text-sm">
                    현재 DB에 저장된 캠페인이 없습니다. 최근 수집 후 다시 확인해 주세요.
                </div>
            ) : null}

            {/* Trending Section - Only show when no filters active */}
            {!isFiltered && dataMode === 'ok' && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-rose-500 text-white text-xs font-black px-2 py-1 rounded-md animate-pulse">TRENDING</span>
                        <h2 className="text-xl font-black text-slate-800">인기 캠페인</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {trending.map(c => (
                            <CampaignCard key={`trend-${c.id}`} campaign={c} />
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4">
                <div className="flex justify-between items-end mb-6">
                    <div className="font-bold text-slate-700 text-lg">
                        총 <span className="text-blue-600">{filtered.length}</span>개의 캠페인
                    </div>
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
                        <h3 className="text-xl font-bold text-slate-700 mb-1">검색 결과가 없습니다</h3>
                        <p className="text-slate-500">필터 조건을 바꾸거나 나중에 다시 시도해 주세요.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
