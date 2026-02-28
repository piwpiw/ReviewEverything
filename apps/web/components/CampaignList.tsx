import { db } from "@/lib/db";
import { buildCampaignsQuery } from "@/lib/queryBuilder";
import { getTrendingCampaigns } from "@/lib/analytics";
import CampaignCard from "./CampaignCard";
import MapView from "./MapView";
import { Zap } from "lucide-react";

export default async function CampaignList({
    searchParams,
    viewMode = "list",
}: { searchParams: Record<string, string | undefined>; viewMode?: string }) {
    const isFiltered = Boolean(searchParams?.q || searchParams?.platform_id || searchParams?.campaign_type || searchParams?.media_type);
    const mode = viewMode || searchParams.view || "list";

    let filtered: any[] = [];
    let trending: any[] = [];
    let dataMode: "ok" | "empty" | "unavailable" = "ok";

    try {
        const qb = buildCampaignsQuery(new URLSearchParams(searchParams as any));

        // Parallel fetch for speed
        const [all, trendData] = await Promise.all([
            db.campaign.findMany({
                where: qb.where,
                orderBy: qb.sort === 'competition_asc' ? { created_at: 'desc' } : (qb.orderBy as any),
                skip: mode === 'map' ? 0 : qb.skip,
                take: mode === 'map' ? 100 : qb.take, // Take more for map view
                include: { platform: true, snapshots: { orderBy: { scraped_at: "desc" }, take: 1 } },
            }),
            getTrendingCampaigns(5),
        ]);

        filtered = qb.sort === 'competition_asc'
            ? all.sort((a: any, b: any) => {
                const ra = a.snapshots[0]?.competition_rate || 999;
                const rb = b.snapshots[0]?.competition_rate || 999;
                return Number(ra) - Number(rb);
            }).slice(0, 20)
            : all;

        trending = trendData;
    } catch (error) {
        console.error("Database connection failed", error);
        dataMode = "unavailable";
    }

    if (dataMode === "ok" && filtered.length === 0) {
        dataMode = "empty";
    }

    if (mode === "map") {
        return <MapView campaigns={filtered} />;
    }

    return (
        <div className="flex flex-col gap-10">
            {dataMode === "unavailable" && (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-rose-700 text-xs font-bold">
                    데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.
                </div>
            )}

            {/* Trending Section - Premium Horizontal Scroll */}
            {!isFiltered && trending.length > 0 && (
                <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-2 px-2">
                        <div className="p-1 rounded-md bg-rose-500">
                            <Zap className="w-3.5 h-3.5 text-white fill-current" />
                        </div>
                        <h2 className="text-lg font-black text-slate-900 tracking-tight">인기 급상승 캠페인</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {trending.map((c) => (
                            <CampaignCard key={`trend-${c.id}`} campaign={c} />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Grid - High Density (5 columns) */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-end px-2">
                    <div className="font-black text-slate-800 text-sm tracking-tight uppercase px-3 py-1 bg-slate-100 rounded-lg">
                        전체 체험단 <span className="text-blue-600">{filtered.length}</span>
                    </div>
                </div>

                {dataMode === "empty" ? (
                    <div className="py-24 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <p className="text-slate-400 font-bold">검색 결과가 없습니다.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filtered.map((campaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
