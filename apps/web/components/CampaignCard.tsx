"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useFavorites } from "@/lib/useFavorites";
import {
  MapPin,
  ShoppingBag,
  Store,
  TrendingDown,
  Heart,
  Zap,
  ExternalLink,
} from "lucide-react";

const getDDay = (date: Date | string | null): { label: string; cls: string; diff: number } => {
  if (!date) return { label: "미정", cls: "dday-ok", diff: 99 };
  const d = new Date(date);
  const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: "마감", cls: "text-slate-400 bg-slate-100", diff: -1 };
  if (diff === 0) return { label: "오늘 마감", cls: "text-rose-600 bg-rose-50 animate-pulse", diff: 0 };
  if (diff <= 3) return { label: `D-${diff}`, cls: "text-rose-500 bg-rose-50", diff };
  return { label: `D-${diff}`, cls: "text-blue-600 bg-blue-50", diff };
};

const MEDIA_MAP: Record<string, { label: string; color: string }> = {
  BP: { label: "블로그", color: "bg-emerald-500" },
  IP: { label: "인스타", color: "bg-pink-500" },
  RS: { label: "릴스", color: "bg-indigo-500" },
  YP: { label: "유튜브", color: "bg-rose-600" },
  SH: { label: "숏츠", color: "bg-red-500" },
  TK: { label: "틱톡", color: "bg-slate-900" },
  CL: { label: "클립", color: "bg-blue-500" },
  OTHER: { label: "기타", color: "bg-slate-400" },
};

export default function CampaignCard({ campaign, rank }: { campaign: any; rank?: number }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const pinned = isFavorite(campaign.id);

  // --- Analytics: View Logging ---
  useEffect(() => {
    const logView = async () => {
      try {
        await fetch("/api/analytics/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId: campaign.id, action: "VIEW" }),
        });
      } catch (e) {
        console.error("View log failed", e);
      }
    };
    logView();
  }, [campaign.id]);

  // --- 가중치 로직 (Weight Logic) ---
  const recruited = campaign.recruit_count ?? 1;
  const applied = campaign.applicant_count ?? 0;
  const compRateValue = campaign.competition_rate ? Number(campaign.competition_rate) : (recruited > 0 ? applied / recruited : 0);
  const progress = recruited > 0 ? Math.min((applied / recruited) * 100, 100) : 0;
  const { label: dLabel, cls: dCls, diff: dDiff } = getDDay(campaign.apply_end_date);

  const rewardVal = campaign.reward_value || 0;
  const isPremiumReward = rewardVal >= 100000;
  const isUrgent = dDiff <= 1 && dDiff >= 0;
  const isViral = compRateValue >= 10;
  const isHighWin = !isViral && compRateValue <= 1.2 && recruited >= 3;

  const media = MEDIA_MAP[campaign.media_type] || MEDIA_MAP.OTHER;

  const cardStyleCls = isPremiumReward
    ? "border-amber-300 dark:border-amber-500/50 shadow-[0_0_25px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/20"
    : isUrgent
      ? "border-rose-300 dark:border-rose-500/50"
      : "border-slate-100 dark:border-slate-800";

  const handleOutbound = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // --- Analytics: Click Logging ---
    try {
      fetch("/api/analytics/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, action: "CLICK" }),
      });
    } catch (e) { }

    if (campaign.shop_url) {
      window.open(campaign.shop_url, "_blank");
    } else if (campaign.campaign_type === "VST") {
      window.open(`https://map.naver.com/v5/search/${encodeURIComponent(campaign.title)}`, "_blank");
    } else {
      window.open(campaign.url, "_blank");
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8 }}
      className={`group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border overflow-hidden flex flex-col h-full shadow-sm hover:shadow-2xl transition-all duration-500 ${cardStyleCls}`}
    >
      {/* 고단가 배경 효과 */}
      {isPremiumReward && (
        <div className="absolute inset-x-0 -top-20 -left-20 w-40 h-40 bg-amber-400/10 blur-[60px] pointer-events-none" />
      )}

      <div className="relative h-[200px] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={
            campaign.thumbnail_url ||
            (campaign.lat && campaign.lng
              ? `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=400&h=300&center=${campaign.lng},${campaign.lat}&level=15&markers=type:d|size:small|pos:${campaign.lng}%20${campaign.lat}|color:red&ncpClientId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "xqc9tm6yw6"}`
              : "https://via.placeholder.com/400?text=ReviewEverything")
          }
          alt={campaign.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-[cubic-bezier(0.2,1,0.2,1)]"
          unoptimized={true}
        />

        <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all duration-500 z-20 translate-y-2 group-hover:translate-y-0">
          <button
            onClick={handleOutbound}
            className="px-5 py-2.5 bg-white/10 backdrop-blur-xl rounded-2xl text-[11px] font-black text-white hover:bg-white hover:text-slate-900 transition-all flex items-center gap-2 border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
          >
            {campaign.campaign_type === "VST" ? <Store className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            {campaign.campaign_type === "VST" ? "매장 바로가기" : "캠페인 상세 보기"}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(campaign.id);
            }}
            className={`w-10 h-10 rounded-[1rem] backdrop-blur-xl flex items-center justify-center transition-all ${pinned ? "bg-rose-500/90 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]" : "bg-white/10 text-white hover:bg-white hover:text-rose-500 border border-white/20"}`}
          >
            <Heart className={`w-5 h-5 ${pinned ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* 다이내믹 배지 시스템 */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
          <div className="flex gap-2">
            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black text-white ${media.color} uppercase tracking-widest shadow-lg shadow-black/10`}>
              {media.label}
            </span>
            {rank && (
              <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[10px] font-black shadow-lg">#{rank}</span>
            )}
          </div>

          {isPremiumReward && (
            <motion.div
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-900 text-[10px] font-black shadow-xl border border-amber-200"
            >
              <Zap className="w-3 h-3 fill-current" />
              프리미엄 보상
            </motion.div>
          )}

          {isViral && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-black shadow-[0_0_15px_rgba(244,63,94,0.4)] border border-rose-400/50"
            >
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              인기 폭발
            </motion.div>
          )}

          {isHighWin && (
            <div className="w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black shadow-xl">
              <Zap className="w-3 h-3 fill-current" />
              당첨 고확률
            </div>
          )}
        </div>

        {/* 긴급 마감 표시 */}
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
          <span className={`px-4 py-2 rounded-2xl font-black text-[10px] shadow-2xl border border-white/30 backdrop-blur-md transition-colors ${isUrgent ? 'bg-rose-600 text-white ring-4 ring-rose-500/20' : dCls}`}>
            {dLabel}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3 relative">
        <div className="flex items-center gap-2 text-[10px] font-black">
          <span className="text-slate-400">@{campaign.platform?.name}</span>
          {campaign.category && (
            <span className={`px-2 py-0.5 rounded-lg ${isPremiumReward ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'}`}>
              {campaign.category}
            </span>
          )}
        </div>

        <Link href={`/campaigns/${campaign.id}`} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">[{campaign.region_depth1 || "전국"}] {campaign.region_depth2 || ""}</span>
          </div>
          <h3 className={`text-[16px] font-black leading-tight transition-colors line-clamp-2 min-h-[3.2rem] ${isPremiumReward ? 'text-amber-900 dark:text-amber-200' : 'text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
            {campaign.title}
          </h3>
        </Link>

        {/* 요약 박스 (가중치 반영) */}
        <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isPremiumReward ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/50' : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100/50'}`}>
          <div className={`p-1.5 rounded-xl shadow-sm ${isPremiumReward ? 'bg-amber-400' : 'bg-white dark:bg-slate-900'}`}>
            <TrendingDown className={`w-3.5 h-3.5 ${isPremiumReward ? "text-white" : isHighWin ? "text-emerald-500" : "text-slate-400 dark:text-slate-600"}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">경쟁 현황</span>
            <span className={`text-[13px] font-black leading-none ${isViral ? 'text-rose-600' : isHighWin ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}>
              {compRateValue.toFixed(1)}:1 <span className="text-[10px] opacity-40 ml-1">({applied}/{recruited})</span>
            </span>
          </div>
          <div className="ml-auto text-right">
            <span className={`text-[12px] font-black block ${isPremiumReward ? 'text-amber-600 scale-110' : 'text-blue-600 dark:text-blue-400'}`}>
              {rewardVal > 0 ? `${(rewardVal / 10000).toFixed(1)}만원 +` : "체험단 혜택"}
            </span>
          </div>
        </div>

        {/* 프로그레스 시스템 */}
        <div className="mt-auto pt-2">
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-full rounded-full ${isViral ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : isHighWin ? "bg-emerald-500" : "bg-blue-500"}`}
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <p className="text-[11px] font-bold text-slate-400">지원 현황 {progress.toFixed(0)}%</p>
            {isUrgent && <span className="text-[10px] font-black text-rose-500 animate-pulse">마감 임박!</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            onClick={handleOutbound}
            className="py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-[12px] font-black transition-all flex items-center justify-center gap-2"
          >
            {campaign.campaign_type === "VST" ? "지도 보기" : "바로가기"}
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <Link
            href={`/campaigns/${campaign.id}`}
            className={`py-3 rounded-2xl text-[12px] font-black transition-all flex items-center justify-center shadow-lg active:scale-95 ${isPremiumReward ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-900 dark:bg-blue-600 text-white hover:shadow-blue-500/20'}`}
          >
            상세 정보
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
