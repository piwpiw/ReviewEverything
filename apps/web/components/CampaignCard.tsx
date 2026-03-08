import { memo, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, ShoppingBag, Store } from "lucide-react";
import { useFavorites } from "@/lib/useFavorites";
import { normalizeCampaignUrl } from "@/lib/campaignLinks";
import { MEDIA_LABEL, TYPE_LABEL } from "@/lib/filterDisplay";
import { getPlatformDisplay } from "@/lib/platformDisplay";
import type { CampaignListItem } from "@/lib/campaignTypes";

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
  BP: { label: MEDIA_LABEL.BP, color: "bg-emerald-500" },
  IP: { label: MEDIA_LABEL.IP, color: "bg-pink-500" },
  YP: { label: MEDIA_LABEL.YP, color: "bg-rose-600" },
  RS: { label: MEDIA_LABEL.RS, color: "bg-indigo-500" },
  SH: { label: MEDIA_LABEL.SH, color: "bg-red-500" },
  TK: { label: MEDIA_LABEL.TK, color: "bg-slate-900" },
  CL: { label: MEDIA_LABEL.CL, color: "bg-blue-500" },
  RD: { label: MEDIA_LABEL.RD, color: "bg-orange-500" },
  FB: { label: MEDIA_LABEL.FB, color: "bg-blue-700" },
  X: { label: MEDIA_LABEL.X, color: "bg-black" },
  SN: { label: MEDIA_LABEL.SN, color: "bg-violet-500" },
  TT: { label: MEDIA_LABEL.TT, color: "bg-cyan-700" },
  OTHER: { label: MEDIA_LABEL.OTHER, color: "bg-slate-500" },
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

function CampaignCardInternal({ campaign, rank }: { campaign: CampaignListItem; rank?: number }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const pinned = isFavorite(campaign.id);

  const recruitCount = Math.max(1, num(campaign.recruit_count, 1));
  const applicantCount = Math.max(0, num(campaign.applicant_count, 0));
  const compRate = campaign.competition_rate ? num(campaign.competition_rate, 0) : applicantCount / recruitCount;
  const reward = num(campaign.reward_value, 0);
  const { label: dLabel, cls: dCls } = getDDay(campaign.apply_end_date || null);
  const campaignType = campaign.campaign_type || "ETC";
  const campaignTypeName = TYPE_LABEL[campaignType] || TYPE_LABEL.ETC;
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
    <article className="premium-card group h-full flex flex-col">
      <div className="relative h-[140px] md:h-[160px] overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={imageUrl}
          alt={campaign.title || "캠페인"}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 15vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          unoptimized={imageUrl.includes("placeholder")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${typeColor} shadow-[0_0_10px_rgba(37,99,235,0.4)]`} />

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 items-center">
          <span className={`px-2 py-1 rounded-lg text-[9px] font-black backdrop-blur-md border ${platformDisplay.badgeClassName} shadow-sm uppercase tracking-wider`}>
            {platformDisplay.shortLabel}
          </span>
          <span className={`px-2 py-1 rounded-lg text-[9px] font-black text-white ${media.color} shadow-sm uppercase tracking-wider`}>
            {media.label}
          </span>
          <span className={`px-2 py-1 rounded-lg text-[9px] font-black backdrop-blur-md border ${dCls} shadow-sm uppercase tracking-wider`}>
            {dLabel}
          </span>
        </div>

        {rank && (
          <div className="absolute right-2.5 top-2.5 w-7 h-7 rounded-xl bg-slate-900/90 backdrop-blur-md flex items-center justify-center text-[10px] font-black text-white shadow-xl border border-white/10">
            {rank}
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(campaign.id);
          }}
          className={`absolute right-2.5 bottom-2.5 h-9 w-9 rounded-2xl border flex items-center justify-center transition-all duration-300 backdrop-blur-lg ${pinned
            ? "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30 scale-105"
            : "bg-white/80 dark:bg-slate-900/80 border-white/20 text-slate-500 hover:text-rose-500 hover:scale-105"
            }`}
          aria-label="즐겨찾기"
        >
          <Heart className={`w-4 h-4 ${pinned ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="p-3.5 flex flex-col flex-1 gap-2.5">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
          <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{campaignTypeName}</span>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
          {campaign.category && (
            <span className="text-blue-600 dark:text-blue-400 font-black">#{campaign.category}</span>
          )}
        </div>

        <Link href={`/campaigns/${campaign.id}`} className="group/title">
          <h3 className="line-clamp-2 text-[14px] font-black leading-tight text-slate-800 dark:text-slate-200 group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
            {campaign.title || "캠페인"}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{locationText}</span>
        </div>

        <div className="mt-auto pt-2 space-y-2">
          {campaign.brief_desc && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-xl border border-blue-100/50 dark:border-blue-900/20">
              <p className="line-clamp-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 leading-none">
                {campaign.brief_desc}
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-800/50">
              <span className="block text-[8px] uppercase tracking-tighter text-slate-400 font-black mb-0.5">Reward</span>
              <span className="block text-[11px] font-black text-blue-600 dark:text-blue-400">
                {reward > 0 ? `${(reward / 10000).toFixed(1)}만` : "미정"}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-800/50">
              <span className="block text-[8px] uppercase tracking-tighter text-slate-400 font-black mb-0.5">Rate</span>
              <span className="block text-[11px] font-black text-slate-700 dark:text-slate-300">{compRate.toFixed(1)}:1</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-800/50">
              <span className="block text-[8px] uppercase tracking-tighter text-slate-400 font-black mb-0.5">Recruit</span>
              <span className="block text-[11px] font-black text-slate-700 dark:text-slate-300">{applicantCount}/{recruitCount}</span>
            </div>
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={(e) => void handleOutbound(e, shopUrl ? "shop" : "campaign")}
              className="flex-1 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black transition-all hover:bg-blue-600 dark:hover:bg-blue-500 dark:hover:text-white flex items-center justify-center gap-2 shadow-sm"
            >
              {shopUrl ? <Store className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
              {shopUrl ? "Store" : "Source"}
            </button>
            <Link
              href={`/campaigns/${campaign.id}`}
              className="flex-1 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-[10px] font-black transition-all hover:border-blue-600 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center shadow-sm"
            >
              상세 보기
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(CampaignCardInternal);
