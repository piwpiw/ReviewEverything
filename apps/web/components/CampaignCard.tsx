"use client";

import { useEffect, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Heart, MapPin, ShoppingBag, Store } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { normalizeCampaignUrl } from "@/lib/campaignLinks";
import { getPlatformDisplay } from "@/lib/platformDisplay";

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
  brief_desc?: string;
};

const TYPE_NAME: Record<string, string> = {
  VST: "방문형",
  SHP: "샘플형",
  PRS: "구매형",
  SNS: "SNS형",
  EVT: "이벤트형",
  APP: "앱형",
  PRM: "홍보형",
  ETC: "기타",
};

const TYPE_COLOR: Record<string, string> = {
  VST: "from-blue-500 to-blue-600",
  SHP: "from-emerald-500 to-emerald-600",
  PRS: "from-amber-500 to-orange-500",
  SNS: "from-fuchsia-500 to-pink-500",
  EVT: "from-purple-500 to-violet-500",
  APP: "from-cyan-500 to-sky-500",
  PRM: "from-rose-500 to-red-500",
  ETC: "from-slate-500 to-slate-600",
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
  TT: { label: "타임", color: "bg-cyan-700" },
  OTHER: { label: "기타", color: "bg-slate-500" },
};

const fallbackMedia = { label: "기타", color: "bg-slate-500" };

const num = (value: number | string | undefined | null, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getDDay = (date: Date | string | null): { label: string; cls: string } => {
  if (!date) return { label: "미정", cls: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800" };
  const target = new Date(date);
  const diff = Math.ceil((target.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: "마감", cls: "text-slate-500 bg-slate-100 dark:text-slate-300 dark:bg-slate-800" };
  if (diff === 0) return { label: "D-Day", cls: "text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/30" };
  if (diff <= 3) return { label: `D-${diff}`, cls: "text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-900/30" };
  return { label: `D-${diff}`, cls: "text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30" };
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
      } catch {
        // noop
      }
    };
    void logView();
  }, [campaign.id]);

  const recruitCount = Math.max(1, num(campaign.recruit_count, 1));
  const applicantCount = Math.max(0, num(campaign.applicant_count, 0));
  const compRate = campaign.competition_rate ? num(campaign.competition_rate, 0) : applicantCount / recruitCount;
  const reward = num(campaign.reward_value, 0);
  const { label: dLabel, cls: dCls } = getDDay(campaign.apply_end_date || null);
  const campaignType = campaign.campaign_type || "ETC";
  const campaignTypeName = TYPE_NAME[campaignType] || TYPE_NAME.ETC;
  const media = MEDIA_CHIP[campaign.media_type || "OTHER"] || fallbackMedia;
  const typeColor = TYPE_COLOR[campaignType] || TYPE_COLOR.ETC;
  const platformDisplay = getPlatformDisplay(campaign.platform?.name);

  const primaryUrl = normalizeCampaignUrl(campaign.url || campaign.link || campaign.source_url || null);
  const shopUrl = normalizeCampaignUrl(campaign.shop_url || campaign.shop_link || campaign.coupon_url || null);
  const fallbackSearchUrl = campaign.title
    ? `https://www.google.com/search?q=${encodeURIComponent(`${campaign.title} ${campaign.platform?.name || ""}`)}`
    : `/campaigns/${campaign.id}`;

  const openLink = (url?: string | null, fallback?: string) => {
    const target = normalizeCampaignUrl(url);
    const resolved = target || fallback;
    if (!resolved) return;
    window.open(resolved, "_blank", "noopener,noreferrer");
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
    } catch {
      // noop
    }

    if (target === "shop" && shopUrl) {
      openLink(shopUrl);
      return;
    }
    openLink(primaryUrl, fallbackSearchUrl);
  };

  const imageUrl = campaign.thumbnail_url || "https://via.placeholder.com/640x360?text=ReviewEverything";
  const locationText = `${campaign.region_depth1 || ""}${campaign.region_depth2 ? ` ${campaign.region_depth2}` : ""}`.trim() || "지역 미지정";

  return (
    <article className="relative overflow-hidden rounded-[1.35rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative h-[112px] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image src={imageUrl} alt={campaign.title || "캠페인 이미지"} fill className="object-cover" unoptimized />
        <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${typeColor}`} />

        <div className="absolute left-2 top-2 flex items-center gap-1">
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-black ${platformDisplay.badgeClassName}`}>
            {platformDisplay.shortLabel}
          </span>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black text-white ${media.color}`}>{media.label}</span>
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${dCls}`}>{dLabel}</span>
        </div>

        {rank ? (
          <span className="absolute right-2 top-2 rounded-lg bg-slate-900/80 px-2 py-0.5 text-[10px] font-black text-white">#{rank}</span>
        ) : null}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(campaign.id);
          }}
          className={`absolute right-2 bottom-2 h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
            pinned
              ? "bg-rose-500/90 border-rose-400/70 text-white"
              : "bg-white/85 border-white/50 text-slate-500 hover:text-rose-500"
          }`}
          aria-label="즐겨찾기"
        >
          <Heart className={`w-4 h-4 ${pinned ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400">
          <span className="truncate max-w-[42%]">{platformDisplay.label}</span>
          <span className="text-slate-300">/</span>
          <span>{campaignTypeName}</span>
          {campaign.category ? <span className="ml-auto text-blue-600 dark:text-blue-300">#{campaign.category}</span> : null}
        </div>

        <Link href={`/campaigns/${campaign.id}`}>
          <h3 className="line-clamp-2 text-[14px] font-black leading-snug text-slate-900 dark:text-white">
            {campaign.title || "캠페인"}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5" />
          <span className="truncate">{locationText}</span>
        </div>

        {campaign.brief_desc ? (
          <p className="line-clamp-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-[10px] font-bold text-blue-700 dark:text-blue-300">
            {campaign.brief_desc}
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 px-1.5 py-1">
            <p className="text-[9px] text-slate-500">보상</p>
            <p className="text-[11px] font-black text-blue-600 dark:text-blue-300">{reward > 0 ? `${(reward / 10000).toFixed(1)}만` : "미정"}</p>
          </div>
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 px-1.5 py-1">
            <p className="text-[9px] text-slate-500">경쟁률</p>
            <p className="text-[11px] font-black text-slate-900 dark:text-white">{compRate.toFixed(1)}:1</p>
          </div>
          <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 px-1.5 py-1">
            <p className="text-[9px] text-slate-500">지원/모집</p>
            <p className="text-[11px] font-black text-slate-900 dark:text-white">{applicantCount}/{recruitCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            type="button"
            onClick={(e) => void handleOutbound(e, shopUrl ? "shop" : "campaign")}
            className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1"
          >
            {shopUrl ? <Store className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            {shopUrl ? "스토어" : "원문"}
          </button>
          <Link
            href={`/campaigns/${campaign.id}`}
            className="h-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white text-[11px] font-black hover:opacity-90 flex items-center justify-center"
          >
            상세
          </Link>

          <a
            href={primaryUrl || fallbackSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => void handleOutbound(e, "campaign")}
            className="col-span-2 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-black text-center hover:border-blue-400 hover:text-blue-500 flex items-center justify-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            {primaryUrl ? "원문으로 이동" : "원문 검색으로 이동"}
          </a>
        </div>
      </div>
    </article>
  );
}
