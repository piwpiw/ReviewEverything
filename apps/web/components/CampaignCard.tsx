"use client";

import { useEffect, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Heart, MapPin, ShoppingBag, Store } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";

type Campaign = {
  id: string;
  campaign_type?: string;
  media_type?: string;
  platform?: { name?: string };
  title?: string;
  region_depth1?: string;
  region_depth2?: string;
  category?: string;
  reward_value?: number | string;
  recruit_count?: number | string;
  applicant_count?: number | string;
  competition_rate?: number | string;
  apply_end_date?: Date | string | null;
  url?: string;
  link?: string;
  source_url?: string;
  thumbnail_url?: string;
  lat?: number | string;
  lng?: number | string;
  shop_url?: string;
  shop_link?: string;
  coupon_url?: string;
};

const getDDay = (date: Date | string | null): { label: string; cls: string } => {
  if (!date) return { label: "미정", cls: "text-slate-400 bg-slate-100" };
  const target = new Date(date);
  const diff = Math.ceil((target.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: "마감", cls: "text-slate-400 bg-slate-100" };
  if (diff === 0) return { label: "D-Day", cls: "text-rose-600 bg-rose-50" };
  if (diff <= 3) return { label: `D-${diff}`, cls: "text-rose-600 bg-rose-50" };
  return { label: `D-${diff}`, cls: "text-blue-600 bg-blue-50" };
};

const TYPE_NAME: Record<string, string> = {
  VST: "방문형",
  SHP: "쇼핑형",
  PRS: "구매형",
  SNS: "SNS형",
  EVT: "이벤트형",
  APP: "앱형",
  PRM: "홍보형",
  ETC: "기타",
};

const TYPE_COLOR: Record<string, string> = {
  VST: "bg-blue-500",
  SHP: "bg-emerald-500",
  PRS: "bg-amber-500",
  SNS: "bg-fuchsia-500",
  EVT: "bg-purple-500",
  APP: "bg-cyan-500",
  PRM: "bg-rose-500",
  ETC: "bg-slate-500",
};

const MEDIA_CHIP: Record<string, { label: string; color: string }> = {
  BP: { label: "블로그", color: "bg-emerald-500" },
  IP: { label: "인스타", color: "bg-pink-500" },
  YP: { label: "유튜브", color: "bg-rose-600" },
  RS: { label: "리뷰", color: "bg-indigo-500" },
  SH: { label: "쇼핑", color: "bg-red-500" },
  TK: { label: "쿠폰", color: "bg-slate-900" },
  CL: { label: "클립", color: "bg-blue-500" },
  RD: { label: "광고", color: "bg-orange-500" },
  FB: { label: "페북", color: "bg-blue-700" },
  X: { label: "X", color: "bg-black" },
  SN: { label: "숏폼", color: "bg-violet-500" },
  TT: { label: "숏클립", color: "bg-cyan-700" },
  OTHER: { label: "기타", color: "bg-slate-500" },
};

const fallbackMedia = { label: "기타", color: "bg-slate-500" };

const num = (value: number | string | undefined | null, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export default function CampaignCard({ campaign, rank }: { campaign: Campaign; rank?: number }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const pinned = isFavorite(campaign.id);

  useEffect(() => {
    const logView = async () => {
      try {
        await fetch("/api/analytics/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId: campaign.id, action: "VIEW" }),
        });
      } catch (error) {
        console.error("View log failed", error);
      }
    };
    logView();
  }, [campaign.id]);

  const recruitCount = num(campaign.recruit_count, 1);
  const applicantCount = num(campaign.applicant_count, 0);
  const compRate = campaign.competition_rate ? num(campaign.competition_rate, 0) : recruitCount > 0 ? applicantCount / recruitCount : 0;
  const reward = num(campaign.reward_value, 0);
  const { label: dLabel, cls: dCls } = getDDay(campaign.apply_end_date || null);
  const campaignType = campaign.campaign_type || "ETC";
  const campaignTypeName = TYPE_NAME[campaignType] || TYPE_NAME.ETC;
  const media = MEDIA_CHIP[campaign.media_type || "OTHER"] || fallbackMedia;
  const campaignTypeColor = TYPE_COLOR[campaignType] || TYPE_COLOR.ETC;
  const primaryUrl = campaign.url || campaign.link || campaign.source_url || "#";
  const shopUrl = campaign.shop_url || campaign.shop_link || campaign.coupon_url;

  const openLink = (url?: string | null, fallback?: string) => {
    if (!url) {
      if (fallback) window.open(fallback, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOutbound = async (event: MouseEvent<HTMLElement>, target: "campaign" | "shop") => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await fetch("/api/analytics/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, action: "CLICK", target }),
      });
    } catch (error) {
      console.error(error);
    }

    if (target === "shop" && shopUrl) {
      openLink(shopUrl);
      return;
    }
    if (target === "shop" && campaignType === "VST") {
      openLink(`https://map.naver.com/v5/search/${encodeURIComponent(campaign.title || "")}`);
      return;
    }
    openLink(primaryUrl);
  };

  const placeholder = "https://via.placeholder.com/640x360?text=ReviewEverything";
  const locationText = `${campaign.region_depth1 || ""}${campaign.region_depth2 ? ` ${campaign.region_depth2}` : ""}`.trim() || "지역 미지정";
  const imageUrl =
    campaign.thumbnail_url ||
    (campaign.lat && campaign.lng
      ? `https://naveropenapi.apigw.ntruss.com/map-static/v2/raster?w=600&h=360&center=${campaign.lng},${campaign.lat}&level=15&markers=type:d|size:small|pos:${campaign.lng}%20${campaign.lat}|color:red&ncpClientId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "xqc9tm6yw6"}`
      : placeholder);

  return (
    <article
      className={`relative bg-white dark:bg-slate-900 rounded-3xl border-l-8 ${campaignTypeColor} border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-full shadow-sm hover:shadow-lg transition-all duration-300`}
    >
      <div className="relative h-[136px] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image src={imageUrl} alt={campaign.title || "리뷰 캠페인"} fill className="object-cover" unoptimized />
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between">
          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black text-white ${media.color}`}>{media.label}</span>
          {rank ? <span className="px-2 py-0.5 rounded-lg text-[11px] font-black text-white bg-slate-900">#{rank}</span> : null}
        </div>
        <div className="absolute top-2 right-2">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleFavorite(campaign.id);
            }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${pinned ? "bg-rose-500/90 text-white" : "bg-white/85 text-slate-500 border border-white/40"}`}
          >
            <Heart className={`w-4 h-4 ${pinned ? "fill-current" : ""}`} />
          </button>
        </div>
        <div className="absolute bottom-2 left-2">
          <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${dCls}`}>{dLabel}</span>
        </div>
        <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white rounded-lg px-2 py-1 text-[11px]">{campaignTypeName}</div>
      </div>

      <div className="p-3.5 flex flex-col flex-1 gap-2">
        <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400">
          <span>[{campaign.platform?.name || "플랫폼"}]</span>
          <span className="text-slate-300">/</span>
          <span>{campaignTypeName}</span>
          {campaign.category ? <span className="ml-auto text-blue-600 dark:text-blue-300">#{campaign.category}</span> : null}
        </div>

        <Link href={`/campaigns/${campaign.id}`}>
          <h3 className="text-[17px] font-black leading-snug text-slate-900 dark:text-white line-clamp-2">
            {campaign.title || "캠페인 제목"}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5" />
          <span>{locationText}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center mt-1">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-1.5 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">보상</p>
            <p className="text-sm font-black text-blue-600 dark:text-blue-300">{reward > 0 ? `${(reward / 10000).toFixed(1)}만원` : "미정"}</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-1.5 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">경쟁률</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{compRate.toFixed(1)}:1</p>
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-1.5 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-500 dark:text-slate-400">지원/모집</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {applicantCount}/{recruitCount}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={(e) => handleOutbound(e, shopUrl ? "shop" : "campaign")}
            className="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1"
          >
            {shopUrl ? <Store className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            {shopUrl ? "스토어 이동" : "자세히 보기"}
            <ExternalLink className="w-3 h-3" />
          </button>
          <Link
            href={`/campaigns/${campaign.id}`}
            className="py-2 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-center text-xs font-black hover:opacity-90 flex items-center justify-center"
          >
            상세 페이지
          </Link>
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => handleOutbound(e, "campaign")}
            className="col-span-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black text-center hover:border-blue-400 hover:text-blue-500"
          >
            원문 링크
          </a>
        </div>
      </div>
    </article>
  );
}
