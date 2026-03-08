import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { buildGeoHintLabel, resolveCampaignCoordinates } from "@/lib/geo/campaignGeo";
import type { CampaignGeoSummaryItem, CampaignListItem, CampaignWithPlatform } from "@/lib/campaignTypes";
import { buildCampaignsQuery } from "@/lib/queryBuilder";
import { hasUsableDatabaseEnv } from "@/lib/runtimeEnv";

const DEFAULT_LIMIT = 24;
const DEFAULT_MAP_LIMIT = 1200;

const PLATFORM_ROWS = [
  { id: 1, name: "Revu", base_url: "https://www.revu.net" },
  { id: 2, name: "Reviewnote", base_url: "https://www.reviewnote.co.kr" },
  { id: 3, name: "DinnerQueen", base_url: "https://dinnerqueen.net" },
  { id: 12, name: "Seouloppa", base_url: "https://www.seoulouba.co.kr" },
  { id: 31, name: "Cloudreview", base_url: "https://www.cloudreview.co.kr" },
] as const;

const REGIONS = [
  { d1: "Seoul", d2: "Gangnam", lat: 37.4979, lng: 127.0276 },
  { d1: "Seoul", d2: "Mapo", lat: 37.5563, lng: 126.9236 },
  { d1: "Seoul", d2: "Jongno", lat: 37.5729, lng: 126.9794 },
  { d1: "Busan", d2: "Haeundae", lat: 35.1632, lng: 129.1635 },
  { d1: "Daegu", d2: "Suseong", lat: 35.8586, lng: 128.6306 },
] as const;

const TYPE_ROWS = ["VST", "SHP", "PRS", "SNS"] as const;
const MEDIA_ROWS = ["BP", "IP", "YP", "CL"] as const;
const CATEGORY_ROWS: Record<string, string[]> = {
  VST: ["restaurant", "cafe", "beauty", "culture", "hotel"],
  SHP: ["food", "living", "beauty"],
  PRS: ["food", "living", "other"],
  SNS: ["clip", "instagram", "reels", "youtube"],
};

const MOCK_CAMPAIGNS: CampaignListItem[] = Array.from({ length: 240 }).map((_, index) => {
  const type = TYPE_ROWS[index % TYPE_ROWS.length];
  const region = REGIONS[index % REGIONS.length];
  const platform = PLATFORM_ROWS[index % PLATFORM_ROWS.length];
  const rewardValue = [30000, 50000, 70000, 120000][index % 4];
  const recruitCount = 10 + (index % 20);
  const applicantCount = 3 + (index % 40);
  const competitionRate = Number((applicantCount / recruitCount).toFixed(1));

  return {
    id: `mock-${index + 1}`,
    title: `[${region.d1} ${region.d2}] Sample campaign ${index + 1}`,
    campaign_type: type,
    media_type: MEDIA_ROWS[index % MEDIA_ROWS.length],
    category: CATEGORY_ROWS[type][index % CATEGORY_ROWS[type].length],
    location: `${region.d1} ${region.d2}`,
    region_depth1: region.d1,
    region_depth2: region.d2,
    lat: region.lat + ((index % 8) - 4) * 0.0032,
    lng: region.lng + ((index % 7) - 3) * 0.0038,
    reward_text: `${Math.floor(rewardValue / 10000)}만원`,
    reward_value: rewardValue,
    recruit_count: recruitCount,
    applicant_count: applicantCount,
    competition_rate: competitionRate,
    apply_end_date: new Date(Date.now() + ((index % 14) + 1) * 86400000).toISOString(),
    thumbnail_url: `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop&sig=${index}`,
    url: platform.base_url,
    geo_match_source: "region_center",
    geo_match_score: 0.72,
    geo_match_label: "region",
    geo_store_key: `${region.d1}-${region.d2}-${index % 24}`,
    platform: { id: platform.id, name: platform.name },
  };
});

const normalize = (value: string | null) => value?.trim() || "";
const toNum = (value: string | null, fallback: number) => {
  if (value === null || value.trim() === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function withFallbackCoords(campaign: CampaignWithPlatform | CampaignGeoSummaryItem): CampaignListItem {
  const region1 = campaign.region_depth1 || "Seoul";
  const region2 = campaign.region_depth2 || "All";
  const applyEndDate =
    "apply_end_date" in campaign
      ? campaign.apply_end_date instanceof Date
        ? campaign.apply_end_date.toISOString()
        : typeof campaign.apply_end_date === "string"
          ? campaign.apply_end_date
          : null
      : null;
  const platform =
    "platform" in campaign && campaign.platform && typeof campaign.platform === "object"
      ? {
        id:
          "id" in campaign.platform && typeof campaign.platform.id === "number"
            ? campaign.platform.id
            : undefined,
        name:
          "name" in campaign.platform && typeof campaign.platform.name === "string"
            ? campaign.platform.name
            : null,
      }
      : null;
  const shopUrl =
    "shop_link" in campaign
      ? campaign.shop_url || campaign.shop_link || campaign.coupon_url || undefined
      : campaign.shop_url || undefined;

  const resolved = resolveCampaignCoordinates({
    existingLat: campaign.lat || undefined,
    existingLng: campaign.lng || undefined,
    location: campaign.location || undefined,
    regionDepth1: region1,
    regionDepth2: region2,
    title: campaign.title || undefined,
    url: campaign.url || undefined,
    shopUrl,
  });

  return {
    ...campaign,
    id: campaign.id,
    campaign_type: campaign.campaign_type || "ETC",
    media_type: campaign.media_type || "OTHER",
    region_depth1: region1,
    region_depth2: region2,
    lat: resolved.lat,
    lng: resolved.lng,
    reward_value: campaign.reward_value ? Number(campaign.reward_value) : 0,
    competition_rate: campaign.competition_rate ? Number(campaign.competition_rate) : 0,
    apply_end_date: applyEndDate,
    geo_match_source: resolved.matchSource,
    geo_match_score: resolved.matchScore,
    geo_match_label: buildGeoHintLabel(resolved.matchSource),
    geo_store_key: resolved.storeKey,
    platform,
  };
}

function applyMockFilters(searchParams: URLSearchParams) {
  const q = normalize(searchParams.get("q")).toLowerCase();
  const campaignType = normalize(searchParams.get("campaign_type"));
  const mediaType = normalize(searchParams.get("media_type"));
  const region1 = normalize(searchParams.get("region_depth1"));
  const region2 = normalize(searchParams.get("region_depth2"));
  const category = normalize(searchParams.get("category"));
  const minReward = toNum(searchParams.get("min_reward"), 0);
  const maxComp = toNum(searchParams.get("max_comp"), Number.POSITIVE_INFINITY);
  const maxDeadlineDays = toNum(searchParams.get("max_deadline_days"), Number.POSITIVE_INFINITY);
  const platformId = normalize(searchParams.get("platform_id"));
  const sort = normalize(searchParams.get("sort")) || "latest_desc";
  const isMap = normalize(searchParams.get("view")) === "map";
  const limit = Math.max(1, Math.min(toNum(searchParams.get("limit"), isMap ? DEFAULT_MAP_LIMIT : DEFAULT_LIMIT), DEFAULT_MAP_LIMIT));
  const page = Math.max(1, toNum(searchParams.get("page"), 1));

  let filtered = [...MOCK_CAMPAIGNS];

  if (campaignType) filtered = filtered.filter((item) => item.campaign_type === campaignType);
  if (mediaType) filtered = filtered.filter((item) => item.media_type === mediaType);
  if (region1) filtered = filtered.filter((item) => item.region_depth1 === region1);
  if (region2) filtered = filtered.filter((item) => item.region_depth2 === region2);
  if (category) filtered = filtered.filter((item) => item.category === category);
  if (platformId) filtered = filtered.filter((item) => String(item.platform?.id || "") === platformId);
  if (minReward > 0) filtered = filtered.filter((item) => Number(item.reward_value || 0) >= minReward);
  if (Number.isFinite(maxComp)) filtered = filtered.filter((item) => Number(item.competition_rate || 0) <= maxComp);
  if (Number.isFinite(maxDeadlineDays)) {
    const cutoff = Date.now() + maxDeadlineDays * 86400000;
    filtered = filtered.filter((item) => new Date(String(item.apply_end_date)).getTime() <= cutoff);
  }
  if (q) {
    filtered = filtered.filter((item) =>
      [item.title, item.location, item.category, item.platform?.name].some((value) => String(value || "").toLowerCase().includes(q)),
    );
  }

  switch (sort) {
    case "deadline_asc":
      filtered.sort((a, b) => new Date(String(a.apply_end_date)).getTime() - new Date(String(b.apply_end_date)).getTime());
      break;
    case "reward_desc":
      filtered.sort((a, b) => Number(b.reward_value || 0) - Number(a.reward_value || 0));
      break;
    case "applicant_desc":
      filtered.sort((a, b) => Number(b.applicant_count || 0) - Number(a.applicant_count || 0));
      break;
    default:
      filtered.sort((a, b) => Number(String(b.id).replace(/\D/g, "")) - Number(String(a.id).replace(/\D/g, "")));
      break;
  }

  const total = filtered.length;
  const paged = isMap ? filtered.slice(0, limit) : filtered.slice((page - 1) * limit, page * limit);

  return {
    campaigns: paged,
    total,
    meta: {
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      unavailable: true,
      message: "Local database is unavailable, using sample campaign data.",
    },
  };
}

export async function getCampaigns(searchParams: URLSearchParams) {
  if (!hasUsableDatabaseEnv()) {
    return applyMockFilters(searchParams);
  }

  const qb = buildCampaignsQuery(searchParams);

  const [rows, totalRows] = await Promise.all([
    db.campaign.findMany({
      where: qb.where,
      orderBy: qb.orderBy as Prisma.CampaignOrderByWithRelationInput | Prisma.CampaignOrderByWithRelationInput[],
      skip: qb.skip,
      take: qb.take,
      include: { platform: true },
    }) as Promise<CampaignWithPlatform[]>,
    db.campaign.count({ where: qb.where }),
  ]);

  return {
    campaigns: rows.map(withFallbackCoords),
    total: totalRows,
    meta: {
      page: qb.page,
      limit: qb.limit,
      totalPages: Math.max(1, Math.ceil(totalRows / qb.limit)),
    },
  };
}
