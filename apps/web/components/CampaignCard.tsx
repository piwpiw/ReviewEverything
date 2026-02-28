"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

/* ── Helpers ── */
const getDDay = (date: Date | string | null): { label: string; cls: string } => {
    if (!date) return { label: "상시", cls: "dday-ok" };
    const d = new Date(date);
    const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    if (diff < 0) return { label: "마감", cls: "dday-urgent" };
    if (diff === 0) return { label: "D-Day", cls: "dday-urgent" };
    if (diff <= 3) return { label: `D-${diff}`, cls: "dday-urgent" };
    if (diff <= 7) return { label: `D-${diff}`, cls: "dday-soon" };
    return { label: `D-${diff}`, cls: "dday-ok" };
};

const MEDIA_ICON: Record<string, string> = {
    IP: "📸",
    BP: "✍️",
    YP: "🎬",
    OTHER: "🔗",
};
const MEDIA_LABEL: Record<string, string> = {
    IP: "인스타",
    BP: "블로그",
    YP: "유튜브",
    OTHER: "기타",
};
const TYPE_LABEL: Record<string, string> = {
    VST: "방문형",
    SHP: "배송형",
    PRS: "기자단",
};

const PLATFORM_COLOR: Record<string, string> = {
    Revu: "#3b82f6",
    Reviewnote: "#8b5cf6",
    DinnerQueen: "#f59e0b",
    ReviewPlace: "#10b981",
    Seouloppa: "#ef4444",
    MrBlog: "#6366f1",
    GangnamFood: "#f97316",
};

export default function CampaignCard({ campaign, rank }: { campaign: any; rank?: number }) {
    const snap = campaign.snapshots?.[0] ?? {};
    const recruited = snap.recruit_count ?? 0;
    const applied = snap.applicant_count ?? 0;
    const compRate = recruited > 0 ? applied / recruited : 0;
    const progress = recruited > 0 ? Math.min((applied / recruited) * 100, 100) : 0;
    const isHot = compRate >= 2.5 || applied >= 50;
    const isFull = progress >= 100;
    const { label: dLabel, cls: dCls } = getDDay(campaign.apply_end_date);
    const platformColor = PLATFORM_COLOR[campaign.platform?.name] ?? "#64748b";

    const fallbackThumb =
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=60&w=400";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className="lift-card group bg-white rounded-2xl border border-slate-100 overflow-hidden flex flex-col h-full shadow-sm"
        >
            {/* ── Thumbnail ── */}
            <div className="relative h-40 overflow-hidden bg-slate-50 flex-shrink-0">
                {campaign.thumbnail_url ? (
                    <Image
                        src={campaign.thumbnail_url}
                        alt={campaign.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        unoptimized={campaign.thumbnail_url.includes("unsplash")}
                    />
                ) : (
                    <Image src={fallbackThumb} alt="thumb" fill className="object-cover opacity-60" unoptimized />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Top badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-10">
                    <span className="badge-platform" style={{ background: platformColor }}>
                        {campaign.platform?.name ?? "?"}
                    </span>
                    {rank && rank <= 3 && (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-white text-[9px] font-black shadow">
                            {rank}
                        </span>
                    )}
                </div>

                {/* D-Day */}
                <div className="absolute top-2 right-2 z-10">
                    <span className={dCls}>{dLabel}</span>
                </div>

                {/* Bottom hot badge */}
                {isHot && !isFull && (
                    <div className="absolute bottom-2 left-2 z-10">
                        <span className="badge-hot">🔥 인기</span>
                    </div>
                )}
                {isFull && (
                    <div className="absolute bottom-2 left-2 z-10">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-700/80 text-white text-[10px] font-black">마감임박</span>
                    </div>
                )}
            </div>

            {/* ── Body ── */}
            <div className="flex flex-col flex-1 p-3 gap-2">
                {/* Media / Type row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px]">{MEDIA_ICON[campaign.media_type] ?? "🔗"}</span>
                        <span className="text-[10px] font-bold text-slate-400">
                            {MEDIA_LABEL[campaign.media_type] ?? "기타"} · {TYPE_LABEL[campaign.campaign_type] ?? "기타"}
                        </span>
                    </div>
                    {compRate > 0 && (
                        <span className="text-[10px] font-black text-rose-500">{compRate.toFixed(1)}:1</span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-[12px] font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2 min-h-[2.2rem]">
                    {campaign.title}
                </h3>

                {/* Location */}
                {campaign.location && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{campaign.location}</span>
                    </div>
                )}

                {/* Reward */}
                {campaign.reward_text && (
                    <div className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg truncate border border-blue-100/50">
                        🎁 {campaign.reward_text}
                    </div>
                )}

                {/* Progress */}
                {recruited > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400">
                            <span>모집 현황</span>
                            <span className={isFull ? "text-rose-500" : "text-blue-600"}>
                                {applied}/{recruited} ({Math.round(progress)}%)
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div className={`progress-fill${isFull ? " hot" : ""}`} style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}

                {/* CTA */}
                <Link
                    href={`/campaigns/${campaign.id}`}
                    className="mt-auto w-full py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-[11px] font-black flex items-center justify-center gap-1 transition-all active:scale-95 group-hover:shadow-md"
                >
                    상세보기
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
        </motion.div>
    );
}
