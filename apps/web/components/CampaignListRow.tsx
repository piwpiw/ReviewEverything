"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, MapPin, Store, Tag, Users } from "lucide-react";
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

const num = (value: number | string | undefined | null, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const getDDay = (date: Date | string | null): string => {
  if (!date) return "미정";
  const target = new Date(date);
  const diff = Math.ceil((target.getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return "마감";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
};

export default function CampaignListRow({ campaign, rank }: { campaign: Campaign; rank?: number }) {
  const campaignType = campaign.campaign_type || "ETC";
  const typeLabel = TYPE_NAME[campaignType] || TYPE_NAME.ETC;
  const recruitCount = Math.max(1, num(campaign.recruit_count, 1));
  const applicantCount = Math.max(0, num(campaign.applicant_count, 0));
  const compRate = campaign.competition_rate ? num(campaign.competition_rate, 0) : applicantCount / recruitCount;
  const reward = num(campaign.reward_value, 0);
  const locationText = `${campaign.region_depth1 || ""}${campaign.region_depth2 ? ` ${campaign.region_depth2}` : ""}`.trim() || "지역 미지정";
  const imageUrl = campaign.thumbnail_url || "https://via.placeholder.com/240x140?text=Review";
  const dday = getDDay(campaign.apply_end_date || null);
  const platformDisplay = getPlatformDisplay(campaign.platform?.name);

  const primaryUrl = normalizeCampaignUrl(campaign.url || campaign.link || campaign.source_url || null);
  const shopUrl = normalizeCampaignUrl(campaign.shop_url || campaign.shop_link || campaign.coupon_url || null);
  const fallbackSearchUrl = campaign.title
    ? `https://www.google.com/search?q=${encodeURIComponent(`${campaign.title} ${campaign.platform?.name || ""}`)}`
    : `/campaigns/${campaign.id}`;

  const trackClick = async (target: "campaign" | "shop") => {
    try {
      await fetch("/api/analytics/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id, action: "CLICK", target }),
      });
    } catch {
      // noop
    }
  };

  const handleOutbound = async (event: MouseEvent<HTMLAnchorElement>, target: "campaign" | "shop") => {
    event.stopPropagation();
    await trackClick(target);
  };

  return (
    <article className="rounded-[1.1rem] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-sm hover:shadow-md transition-all">
      <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_164px] gap-2.5 items-stretch">
        <div className="relative h-[96px] md:h-[102px] rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
          <Image src={imageUrl} alt={campaign.title || "캠페인"} fill className="object-cover" unoptimized />
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-black ${platformDisplay.badgeClassName}`}>
              {platformDisplay.shortLabel}
            </span>
            <span className="px-2 py-1 rounded-lg bg-slate-900/80 text-white text-[10px] font-black">{typeLabel}</span>
            <span className="px-2 py-1 rounded-lg bg-white/85 text-slate-900 text-[10px] font-black">{dday}</span>
          </div>
          {rank ? (
            <span className="absolute right-2 top-2 px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black">#{rank}</span>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center flex-wrap gap-1.5 text-[10px] font-black">
            <span className={`inline-flex items-center rounded-md border px-2 py-1 ${platformDisplay.badgeClassName}`}>
              {platformDisplay.label}
            </span>
            {campaign.category ? (
              <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 inline-flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {campaign.category}
              </span>
            ) : null}
            <span className="text-slate-400">{campaign.media_type || "매체 미지정"}</span>
          </div>

          <Link href={`/campaigns/${campaign.id}`} className="group">
            <h3 className="text-[14px] md:text-[15px] font-black text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-300">
              {campaign.title || "캠페인"}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-300">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{locationText}</span>
          </div>

          {campaign.brief_desc ? (
            <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-1 rounded-lg bg-slate-50 dark:bg-slate-800/70 px-2 py-1">
              {campaign.brief_desc}
            </p>
          ) : null}

          <div className="grid grid-cols-3 gap-1 mt-auto">
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-1.5 text-center">
              <p className="text-[9px] text-slate-500">보상</p>
              <p className="text-[12px] font-black text-blue-600 dark:text-blue-300">{reward > 0 ? `${(reward / 10000).toFixed(1)}만` : "미정"}</p>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-1.5 text-center">
              <p className="text-[9px] text-slate-500">경쟁률</p>
              <p className="text-[12px] font-black text-slate-900 dark:text-white">{compRate.toFixed(1)}:1</p>
            </div>
            <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-1.5 text-center">
              <p className="text-[9px] text-slate-500 inline-flex items-center gap-1">
                <Users className="w-3 h-3" />
                지원/모집
              </p>
              <p className="text-[12px] font-black text-slate-900 dark:text-white">{applicantCount}/{recruitCount}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
          <Link
            href={`/campaigns/${campaign.id}`}
            className="h-8 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-[10px] font-black flex items-center justify-center hover:opacity-90"
          >
            상세 확인
          </Link>

          <a
            href={shopUrl || primaryUrl || fallbackSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => void handleOutbound(e, shopUrl ? "shop" : "campaign")}
            className="h-8 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black flex items-center justify-center gap-1.5 hover:border-blue-400 hover:text-blue-500"
          >
            {shopUrl ? <Store className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
            {shopUrl ? "스토어 이동" : primaryUrl ? "원문 이동" : "원문 검색"}
          </a>

          <a
            href={fallbackSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => void handleOutbound(e, "campaign")}
            className="col-span-2 lg:col-span-1 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[10px] font-black flex items-center justify-center"
          >
            제목 기반 빠른 탐색
          </a>
        </div>
      </div>
    </article>
  );
}
