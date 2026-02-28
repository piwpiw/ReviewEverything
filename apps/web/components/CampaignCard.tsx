"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useFavorites } from "@/lib/useFavorites";
import {
    MapPin,
    ExternalLink,
    ShoppingBag,
    Store,
    Zap,
    TrendingDown,
    Clock,
    Heart
} from "lucide-react";

/* ── Helpers ── */
const getDDay = (date: Date | string | null): { label: string; cls: string; diff: number } => {
    if (!date) return { label: "상시", cls: "dday-ok", diff: 99 };
    const d = new Date(date);
    const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    if (diff < 0) return { label: "마감", cls: "text-slate-400 bg-slate-100", diff: -1 };
    if (diff === 0) return { label: "마감임박", cls: "text-rose-600 bg-rose-50 animate-pulse", diff: 0 };
    if (diff <= 3) return { label: `D-${diff}`, cls: "text-rose-500 bg-rose-50", diff };
    return { label: `D-${diff}`, cls: "text-blue-600 bg-blue-50", diff };
};

const B_COLORS: Record<string, string> = {
    Revu: "#2563eb", Reviewnote: "#7c3aed", DinnerQueen: "#ea580c",
    ReviewPlace: "#059669", Seouloppa: "#dc2626", MrBlog: "#4f46e5", GangnamFood: "#d97706"
};

const MEDIA_MAP: Record<string, { label: string; color: string }> = {
    BP: { label: "블로그", color: "bg-emerald-500" },
    IP: { label: "인스타", color: "bg-pink-500" },
    RS: { label: "릴스", color: "bg-indigo-500" },
    YP: { label: "유튜브", color: "bg-rose-600" },
    SH: { label: "쇼츠", color: "bg-red-500" },
    TK: { label: "틱톡", color: "bg-slate-900" },
    CL: { label: "클립", color: "bg-blue-500" },
    OTHER: { label: "기타", color: "bg-slate-400" }
};

export default function CampaignCard({ campaign, rank }: { campaign: any; rank?: number }) {
    const { isFavorite, toggleFavorite } = useFavorites();
    const pinned = isFavorite(campaign.id);

    const recruited = campaign.recruit_count ?? 1;
    const applied = campaign.applicant_count ?? 0;
    const compRateValue = campaign.competition_rate ? Number(campaign.competition_rate) : (recruited > 0 ? applied / recruited : 0);
    const progress = recruited > 0 ? Math.min((applied / recruited) * 100, 100) : 0;
    const { label: dLabel, cls: dCls, diff: dDiff } = getDDay(campaign.apply_end_date);

    const isHighWin = compRateValue <= 1.2 && recruited >= 3;
    const platformColor = B_COLORS[campaign.platform?.name] ?? "#64748b";
    const media = MEDIA_MAP[campaign.media_type] || MEDIA_MAP.OTHER;

    const handleOutbound = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (campaign.shop_url) {
            window.open(campaign.shop_url, '_blank');
        } else {
            // Fallback for VST: Naver Map search
            if (campaign.campaign_type === 'VST') {
                window.open(`https://map.naver.com/v5/search/${encodeURIComponent(campaign.title)}`, '_blank');
            } else {
                window.open(campaign.url, '_blank');
            }
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -6 }}
            className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-2xl hover:shadow-slate-900/10 dark:hover:shadow-blue-500/10 transition-all duration-500"
        >
            {/* ── Visual Section ── */}
            <div className="relative h-40 overflow-hidden bg-slate-50">
                <Image
                    src={campaign.thumbnail_url || "https://via.placeholder.com/400?text=No+Image"}
                    alt={campaign.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-in-out"
                    unoptimized={campaign.thumbnail_url?.includes("unsplash")}
                />

                {/* Outbound Link Overlay (Moaview Style) */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <button
                        onClick={handleOutbound}
                        className="px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-black text-white hover:bg-white hover:text-slate-900 transition-all flex items-center gap-1.5 border border-white/20"
                    >
                        {campaign.campaign_type === 'VST' ? <Store className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                        {campaign.campaign_type === 'VST' ? '지도 바로가기' : '상품 페이지'}
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(campaign.id); }}
                        className={`w-8 h-8 rounded-xl backdrop-blur-md flex items-center justify-center transition-all ${pinned ? 'bg-rose-500 text-white' : 'bg-white/10 text-white hover:bg-white hover:text-rose-500 border border-white/20'}`}
                    >
                        <Heart className={`w-4 h-4 ${pinned ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                    <div className="flex gap-1.5">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black text-white ${media.color} uppercase tracking-widest shadow-lg`}>
                            {media.label}
                        </span>
                        {rank && (
                            <span className="px-2 py-1 rounded-lg bg-slate-900 text-white text-[8px] font-black shadow-lg">TOP {rank}</span>
                        )}
                    </div>
                    {isHighWin && (
                        <div className="w-fit flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[9px] font-black shadow-xl animate-pulse">
                            <Zap className="w-2.5 h-2.5 fill-current" />
                            당첨 확률 HIGH
                        </div>
                    )}
                </div>

                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                    <span className={`px-3 py-1.5 rounded-xl font-black text-[9px] shadow-xl border border-white/30 backdrop-blur-md ${dCls}`}>
                        {dLabel}
                    </span>
                </div>
            </div>

            {/* ── Content Section ── */}
            <div className="p-4 flex flex-col flex-1 gap-2.5 relative">
                {/* Meta Labels */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-slate-400">#{campaign.platform?.name}</span>
                        {campaign.category && (
                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">#{campaign.category}</span>
                        )}
                    </div>
                </div>

                {/* Title & Region */}
                <Link href={`/campaigns/${campaign.id}`} className="flex flex-col gap-1 group/title">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                        <MapPin className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                        <span className="truncate">[{campaign.region_depth1 || '전국'}] {campaign.region_depth2 || ''}</span>
                    </div>
                    <h3 className="text-[13px] font-black text-slate-900 dark:text-white leading-tight group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors line-clamp-2 min-h-[2.4rem]">
                        {campaign.title}
                    </h3>
                </Link>

                {/* Reward & Stats */}
                <div className="flex items-center gap-2 p-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100/50 dark:border-slate-700/50">
                    <div className="p-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                        <TrendingDown className={`w-3 h-3 ${isHighWin ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-600'}`} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase leading-none mb-0.5">Competition</span>
                        <span className={`text-[11px] font-black leading-none ${isHighWin ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                            {compRateValue.toFixed(1)}:1 <span className="text-[8px] opacity-40 ml-0.5">({applied}/{recruited})</span>
                        </span>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 truncate max-w-[80px]">
                            {campaign.reward_value > 0 ? `${(campaign.reward_value / 10000).toFixed(0)}만원+` : '상세보상'}
                        </span>
                    </div>
                </div>

                <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
                    <button
                        onClick={handleOutbound}
                        className="py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5"
                    >
                        {campaign.campaign_type === 'VST' ? '매장지도' : '상품링크'}
                        <ExternalLink className="w-3 h-3" />
                    </button>
                    <Link
                        href={`/campaigns/${campaign.id}`}
                        className="py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-[10px] font-black transition-all flex items-center justify-center shadow-lg active:scale-95 hover:bg-blue-600 dark:hover:bg-blue-500"
                    >
                        상세보기
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
