import Link from "next/link";
import { ScrapedCampaign } from "@/sources/types";

export default function CampaignCard({ campaign }: { campaign: any }) {
    const compRate = campaign.snapshots?.[0]?.competition_rate || 0;
    // Adjusted logic to favor high quality mock displays
    const isLowComp = compRate <= 1.5 && campaign.snapshots?.[0]?.recruit_count > 0;

    return (
        <div className="group relative border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 bg-white flex flex-col transition-all duration-500 ease-in-out cursor-pointer z-0 hover:z-10">
            <div className="relative h-60 overflow-hidden">
                {campaign.thumbnail_url ? (
                    <img src={campaign.thumbnail_url} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 ease-out" />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">No Image</div>
                )}

                {/* Overlay gradient for premium readable text */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-black px-3 py-1.5 rounded-lg shadow-lg">
                        {campaign.platform.name}
                    </span>
                    {isLowComp && (
                        <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-lg animate-pulse flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            꿀알바
                        </span>
                    )}
                </div>
            </div>

            <div className="p-6 flex flex-col flex-1 bg-white relative">
                <h3 className="font-extrabold text-xl mb-3 line-clamp-2 text-slate-900 leading-tight group-hover:text-blue-600 transition-colors drop-shadow-sm">{campaign.title}</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                    <span className="bg-slate-50 text-slate-600 px-2.5 py-1 text-xs font-bold rounded-md border border-slate-100 flex items-center gap-1">📍 {campaign.location || "지역 무관"}</span>
                    <span className="bg-slate-50 text-blue-600 px-2.5 py-1 text-xs font-bold rounded-md border border-slate-100">{campaign.media_type === 'IP' ? '📷 인스타' : campaign.media_type === 'BP' ? '📝 블로그' : '▶️ 유튜브'}</span>
                    <span className="bg-slate-50 text-indigo-600 px-2.5 py-1 text-xs font-bold rounded-md border border-slate-100">{campaign.campaign_type === 'VST' ? '🚶 방문' : campaign.campaign_type === 'SHP' ? '📦 배송' : '기자단'}</span>
                </div>

                <div className="mt-auto flex justify-between items-center pt-5 border-t border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-extrabold mb-0.5 tracking-wider">신청 현황</span>
                        <div className="flex items-baseline gap-1">
                            <span className="font-black text-slate-900 text-lg">{campaign.snapshots?.[0]?.applicant_count || 0}</span>
                            <span className="text-slate-400 font-bold text-xs">/ {campaign.snapshots?.[0]?.recruit_count || 0}</span>
                        </div>
                    </div>
                    <Link href={`/campaigns/${campaign.id}`} className="bg-slate-900 text-white hover:bg-blue-600 px-5 py-2.5 rounded-xl text-sm font-black transition-all shadow-md hover:shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95">
                        접수하기
                    </Link>
                </div>
            </div>
        </div>
    );
}
