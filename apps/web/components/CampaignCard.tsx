"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Instagram, Bookmark, Play, MessageSquare, ArrowRight, TrendingUp, Calendar, Gift } from "lucide-react";

const getDDay = (dateString: string | null) => {
    if (!dateString) return null;
    const target = new Date(dateString);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "마감";
    if (days === 0) return "오늘 마감";
    return `D-${days}`;
};

const getMediaTypeLabel = (type: string | null) => {
    switch (type) {
        case 'IP': return '인스타그램';
        case 'YP': return '유튜브';
        case 'BP': return '블로그';
        default: return '기타';
    }
};

const getCampaignTypeLabel = (type: string | null) => {
    switch (type) {
        case 'VST': return '방문형';
        case 'SHP': return '배송형';
        case 'PRS': return '기자단';
        default: return '기타';
    }
};

export default function CampaignCard({ campaign }: { campaign: any }) {
    const snapshots = campaign.snapshots || [];
    const latest = snapshots[0] || {};
    const recruitCount = latest.recruit_count || 0;
    const applicantCount = latest.applicant_count || 0;
    const competitionRate = latest.competition_rate || (recruitCount > 0 ? applicantCount / recruitCount : 0);

    const progress = recruitCount > 0 ? Math.min((applicantCount / recruitCount) * 100, 100) : 0;
    const isHot = competitionRate >= 2.0;
    const dDay = getDDay(campaign.apply_end_date);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="group glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-out bg-white flex flex-col h-full border border-slate-100"
        >
            {/* Thumbnail Area - Reduced height for density */}
            <div className="relative h-44 overflow-hidden">
                {campaign.thumbnail_url ? (
                    <Image
                        src={campaign.thumbnail_url}
                        alt={campaign.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        priority={false}
                    />
                ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                        <Bookmark className="w-8 h-8 text-slate-200" />
                    </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <div className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold tracking-tight shadow-xl">
                        {campaign.platform?.name}
                    </div>
                    {dDay && (
                        <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold shadow-xl backdrop-blur-md ${dDay.includes('오늘') || dDay === '마감'
                                ? 'bg-rose-500/80 border-rose-400/30 text-white'
                                : 'bg-white/80 border-slate-200 text-slate-900'
                            }`}>
                            {dDay}
                        </div>
                    )}
                </div>

                {/* Hot Badge */}
                {isHot && (
                    <div className="absolute bottom-3 right-3 z-10 px-2 py-1 rounded-lg bg-orange-500 backdrop-blur-md text-white text-[10px] font-black flex items-center gap-1 shadow-lg animate-pulse">
                        <TrendingUp className="w-3 h-3" />
                        인기
                    </div>
                )}
            </div>

            {/* Content Area - Denser spacing */}
            <div className="p-4 flex flex-col flex-1 bg-white/50">
                {/* Media & Type Info */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <div className={`p-1 rounded-md ${campaign.media_type === 'IP' ? 'bg-pink-50 text-pink-600' :
                                campaign.media_type === 'YP' ? 'bg-red-50 text-red-600' :
                                    'bg-green-50 text-green-600'
                            }`}>
                            {campaign.media_type === 'IP' ? <Instagram className="w-3 h-3" /> :
                                campaign.media_type === 'YP' ? <Play className="w-3 h-3" /> :
                                    <MessageSquare className="w-3 h-3" />}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">
                            {getMediaTypeLabel(campaign.media_type)} · {getCampaignTypeLabel(campaign.campaign_type)}
                        </span>
                    </div>
                </div>

                <h3 className="font-bold text-sm leading-snug text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2 mb-3 min-h-[2.5rem]">
                    {campaign.title}
                </h3>

                {/* Info List */}
                <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11px] font-medium truncate">{campaign.location || "전국/재택"}</span>
                    </div>
                    {campaign.reward_text && (
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50/50 p-1.5 rounded-lg border border-blue-100/30">
                            <Gift className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-[11px] font-bold truncate">{campaign.reward_text}</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar Area */}
                <div className="mt-auto space-y-1.5">
                    <div className="flex justify-between items-end text-[10px] font-bold">
                        <span className="text-slate-400">모집 현황</span>
                        <div className="flex items-center gap-1">
                            <span className="text-slate-900">{applicantCount}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-slate-400">{recruitCount}</span>
                            <span className={`ml-1 ${progress >= 100 ? 'text-rose-500' : 'text-blue-600'}`}>
                                ({progress.toFixed(0)}%)
                            </span>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${progress >= 100 ? 'bg-rose-500' : 'bg-blue-600'}`}
                        />
                    </div>
                </div>

                <Link href={`/campaigns/${campaign.id}`} className="mt-4 w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 group-hover:bg-blue-600 transition-all active:scale-95">
                    상세보기
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </motion.div>
    );
}
