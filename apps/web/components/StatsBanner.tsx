import { db } from "@/lib/db";

const PLATFORM_COLORS: Record<string, string> = {
    "Revu": "#3b82f6",
    "Reviewnote": "#8b5cf6",
    "DinnerQueen": "#f59e0b",
    "ReviewPlace": "#10b981",
    "Seouloppa": "#ef4444",
    "MrBlog": "#6366f1",
    "GangnamFood": "#f97316",
};

export default async function StatsBanner() {
    let totalCampaigns = 0;
    let platformBreakdown: { name: string; count: number }[] = [];
    let typeBreakdown: { campaign_type: string | null; _count: { campaign_type: number } }[] = [];

    try {
        const [total, platforms, types] = await Promise.all([
            db.campaign.count(),
            db.campaign.groupBy({ by: ["platform_id"], _count: { platform_id: true } }),
            db.campaign.groupBy({ by: ["campaign_type"], _count: { campaign_type: true } }),
        ]);
        totalCampaigns = total;
        typeBreakdown = types;

        // Get platform names
        const allPlatforms = await db.platform.findMany();
        platformBreakdown = (platforms as any[]).map(p => {
            const plat = allPlatforms.find(pl => pl.id === p.platform_id);
            return { name: plat?.name ?? "기타", count: p._count.platform_id };
        }).sort((a, b) => b.count - a.count);
    } catch {
        // silently fail
    }

    const vstCount = typeBreakdown.find(t => t.campaign_type === "VST")?._count.campaign_type ?? 0;
    const shpCount = typeBreakdown.find(t => t.campaign_type === "SHP")?._count.campaign_type ?? 0;

    return (
        <div className="mt-10 flex flex-wrap gap-4 items-center">
            {/* Total */}
            <div className="flex flex-col bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-6 py-4 rounded-2xl shadow-xl shadow-blue-500/20 min-w-[140px]">
                <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">전체 캠페인</span>
                <span className="text-3xl font-black">{totalCampaigns.toLocaleString()}</span>
            </div>

            {/* Type breakdown */}
            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-md px-5 py-4 rounded-2xl border border-white shadow-sm">
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">방문형</div>
                    <div className="text-xl font-black text-slate-900">{vstCount.toLocaleString()}</div>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">배송형</div>
                    <div className="text-xl font-black text-slate-900">{shpCount.toLocaleString()}</div>
                </div>
            </div>

            {/* Platform dots */}
            <div className="flex items-center gap-2 flex-wrap">
                {platformBreakdown.slice(0, 7).map(p => (
                    <div key={p.name} className="flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-2 rounded-xl border border-white shadow-sm">
                        <div className="w-2 h-2 rounded-full" style={{ background: PLATFORM_COLORS[p.name] ?? "#64748b" }} />
                        <span className="text-[10px] font-bold text-slate-600">{p.name}</span>
                        <span className="text-[10px] font-black text-slate-900">{p.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
