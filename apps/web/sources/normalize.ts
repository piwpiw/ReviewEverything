import { db } from "../lib/db";
import { ScrapedCampaign } from "./types";
import { resolveCampaignCoordinates } from "../lib/geo/campaignGeo";
import { Prisma } from "@prisma/client";

const REGION_ALIASES: Record<string, string> = {
  seoul: "서울",
  "seoul special city": "서울",
  "서울특별시": "서울",
  busan: "부산",
  "busan metropolitan city": "부산",
  "부산광역시": "부산",
  incheon: "인천",
  "incheon metropolitan city": "인천",
  "인천광역시": "인천",
  daegu: "대구",
  "대구광역시": "대구",
  gwangju: "광주",
  "광주광역시": "광주",
  ulsan: "울산",
  "울산광역시": "울산",
  daejeon: "대전",
  "대전광역시": "대전",
  gyeonggi: "경기",
  "경기도": "경기",
  gangwon: "강원",
  "강원도": "강원",
  jeju: "제주",
  "제주특별자치도": "제주",
  sejong: "세종",
  "세종특별자치시": "세종",
  gyeongbuk: "경북",
  "경상북도": "경북",
  gyeongnam: "경남",
  "경상남도": "경남",
};

const KEYWORDS = {
  visit: ["방문", "체험", "visit", "vst", "visit campaign", "onsite", "store", "offline", "foot traffic", "in-store"],
  ship: ["배송", "배달", "택배", "delivery", "ship", "shipping", "sample", "sampling", "purchase", "shipped", "ship review", "freebie"],
  media: {
    ip: ["인스타", "인스타그램", "instagram", "insta", "reels", "sns", "social", "influencer", "ig"],
    yp: ["유튜브", "youtube", "yout", "shorts", "creator", "video"],
    tk: ["틱톡", "tiktok", "short", "fyp", "video"],
    bp: ["블로그", "blog", "blogger", "community", "post", "review"],
    rs: ["reel", "reels", "story", "clip"],
    sh: ["short", "shortform", "clip", "snippet"],
    cl: ["clip", "clip", "mini video", "vertical"],
  },
  category: {
    food: ["food", "restaurant", "cafe", "taste", "menu", "meal", "dining", "gourmet", "bakery", "kitchen"],
    beauty: ["beauty", "skincare", "cosmetic", "hair", "makeup", "bodycare", "salon", "care"],
    app: ["app", "install", "download", "signup", "member", "app test", "mobile"],
    event: ["event", "campaign", "launch", "promo", "festival", "contest", "offer", "recruit"],
    content: ["content", "review", "promotion", "pr", "sns", "social", "production", "photo", "video"],
  },
};

function normalizeText(value: unknown): string {
  if (value == null) return "";
  return String(value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, keywords: string[]): boolean {
  const lowered = text.toLowerCase();
  return keywords.some((keyword) => lowered.includes(keyword.toLowerCase()));
}

export function normalizeKoreanText(text: string): string {
  return normalizeText(text).toLowerCase();
}

export function normalizeCampaignType(typeRaw: string): "VST" | "SHP" | "PRS" {
  const text = normalizeKoreanText(typeRaw);
  if (containsAny(text, KEYWORDS.visit) || text.includes("visit")) return "VST";
  if (containsAny(text, KEYWORDS.ship) || text.includes("delivery")) return "SHP";
  return "PRS";
}

export function normalizeMediaType(mediaRaw: string): string {
  const text = normalizeKoreanText(mediaRaw);
  if (!text) return "OTHER";
  if (containsAny(text, KEYWORDS.media.ip)) return "IP";
  if (containsAny(text, KEYWORDS.media.yp)) return "YP";
  if (containsAny(text, KEYWORDS.media.tk)) return "TK";
  if (containsAny(text, KEYWORDS.media.bp)) return "BP";
  if (containsAny(text, KEYWORDS.media.rs)) return "RS";
  if (containsAny(text, KEYWORDS.media.sh)) return "SH";
  if (containsAny(text, KEYWORDS.media.cl)) return "CL";
  return "OTHER";
}

function collectRewardNumbers(text: string): number[] {
  const normalized = normalizeText(text).replace(/,/g, "").toLowerCase();
  const values = new Set<number>();
  let matchedByUnit = false;

  const add = (regex: RegExp, factor = 1) => {
    let m: RegExpExecArray | null;
    while ((m = regex.exec(normalized)) !== null) {
      const raw = Number.parseFloat(m[1]);
      if (Number.isFinite(raw)) {
        matchedByUnit = true;
        values.add(Math.round(raw * factor));
      }
    }
  };

  add(/(\d+(?:\.\d+)?)\s*억/g, 100_000_000);
  add(/(\d+(?:\.\d+)?)\s*만(?:원)?/g, 10_000);
  add(/(\d+(?:\.\d+)?)\s*천원/g, 1_000);
  add(/(\d+(?:\.\d+)?)\s*달러/g, 1_300);
  add(/(\d+(?:\.\d+)?)\s*(billion|bn)\b/g, 100_000_000);
  add(/(\d+(?:\.\d+)?)\s*(million|m)\b/g, 1_000_000);
  add(/(\d+(?:\.\d+)?)\s*(ten thousand|man|10k|10000)\b/g, 10_000);
  add(/(\d+(?:\.\d+)?)\s*(thousand|thou|k)\b/g, 1_000);
  add(/(\d+(?:\.\d+)?)\s*(won|krw)\b/g, 1);
  add(/(\d+(?:\.\d+)?)\s*(?:\$|usd)\b/g, 1_300);

  const fallback = normalized.match(/\d[\d,]*/g);
  if (!matchedByUnit && fallback) {
    for (const raw of fallback) {
      const value = Number.parseInt(raw, 10);
      if (Number.isFinite(value) && value >= 1000) values.add(value);
    }
  }

  return Array.from(values);
}

export function normalizeRewardValue(text: string): number {
  if (!text) return 0;
  const values = collectRewardNumbers(text);
  if (!values.length) return 0;
  return Math.max(...values);
}

export interface RewardParseResult {
  value: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  method: "unit_parse" | "fallback_number" | "zero";
}

export function normalizeRewardValueWithConfidence(text: string): RewardParseResult {
  if (!text) return { value: 0, confidence: "LOW", method: "zero" };
  const normalized = normalizeText(text);
  const values = collectRewardNumbers(normalized);
  if (!values.length) return { value: 0, confidence: "LOW", method: "zero" };

  const hasUnit = /(억|만(?:원)?|천원|달러|billion|million|thousand|man|won|krw|usd|\$)/i.test(normalized);
  return {
    value: Math.max(...values),
    confidence: !hasUnit ? "LOW" : values.length > 1 ? "MEDIUM" : "HIGH",
    method: hasUnit ? "unit_parse" : "fallback_number",
  };
}

export function normalizeRegion(location: string): [string | null, string | null] {
  const raw = normalizeText(location);
  if (!raw) return [null, null];

  const parts = raw.split(/[\s,>/|]+/).filter(Boolean);
  const depth1Raw = parts[0] || null;
  const depth1 = depth1Raw ? REGION_ALIASES[depth1Raw.toLowerCase()] ?? depth1Raw : null;
  const depth2 = parts[1] || null;

  return [depth1, depth2];
}

function detectCategory(text: string): string {
  const lower = normalizeText(text).toLowerCase();
  if (containsAny(lower, KEYWORDS.category.food)) return "Food";
  if (containsAny(lower, KEYWORDS.category.beauty)) return "Beauty";
  if (containsAny(lower, KEYWORDS.category.app)) return "App";
  if (containsAny(lower, KEYWORDS.category.event)) return "Event";
  if (containsAny(lower, KEYWORDS.category.content)) return "Content";
  return "General";
}

export function normalizeCategory(title: string, type: string, reward: string): [string | null, string | null] {
  const combined = `${title} ${reward}`.toLowerCase();
  const category = detectCategory(combined);
  let subCategory = "Default";

  if (type === "VST") {
    subCategory = containsAny(combined, ["visit", "store", "on-site", "offline"]) ? "Visit" : "Onsite";
  } else if (type === "SHP") {
    subCategory = containsAny(combined, ["sample", "delivery", "purchase"]) ? "Purchase" : "Sample";
  } else {
    subCategory = containsAny(combined, ["review", "sns", "youtube", "instagram", "content"]) ? "PR" : "Promotion";
  }

  return [category, subCategory];
}

function toAbsoluteUrl(rawUrl: string, origin: string): string {
  const normalized = normalizeText(rawUrl);
  if (!normalized) throw new Error("missing_campaign_url");

  if (/^https?:\/\//i.test(normalized)) {
    return normalizeTrackedUrl(normalized);
  }
  if (normalized.startsWith("/")) {
    return normalizeTrackedUrl(`${origin}${normalized}`);
  }
  try {
    return normalizeTrackedUrl(new URL(normalized, origin).toString());
  } catch {
    return normalizeTrackedUrl(`${origin.replace(/\/+$/, "")}/campaign/${Date.now()}`);
  }
}

function normalizeTrackedUrl(raw: string): string {
  const normalized = normalizeText(raw);
  const parsed = new URL(normalized);
  if (!/^(https?:)$/i.test(parsed.protocol)) {
    return normalized.replace(/\/$/, "");
  }
  parsed.hash = "";
  return parsed.toString().replace(/\/$/, "");
}

function toShopUrl(raw: string | undefined, fallbackTitle: string): string {
  if (!raw) {
    return `https://map.naver.com/p/search/${encodeURIComponent(fallbackTitle)}`;
  }
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const isMapHost = host.includes("naver") || host.includes("kakao") || host.includes("google") || host.includes("place");
    if (!/^(https?:)$/i.test(parsed.protocol) || !isMapHost) {
      return `https://map.naver.com/p/search/${encodeURIComponent(fallbackTitle)}`;
    }
    return normalizeTrackedUrl(parsed.toString());
  } catch {
    return `https://map.naver.com/p/search/${encodeURIComponent(fallbackTitle)}`;
  }
}

export async function processAndDedupeCampaign(platformId: number, item: ScrapedCampaign) {
  const title = normalizeText(item.title);
  const rewardText = normalizeText(item.reward_text || "");
  const location = normalizeText(item.location || "");
  const [depth1, depth2] = normalizeRegion(location);
  const geo = resolveCampaignCoordinates({
    existingLat: item.lat,
    existingLng: item.lng,
    location,
    regionDepth1: depth1,
    regionDepth2: depth2,
    title,
    url: item.url,
    shopUrl: item.shop_url,
  });

  const campaignType = normalizeCampaignType(item.campaign_type);
  const mediaType = normalizeMediaType(item.media_type);
  const rewardValue = normalizeRewardValue(rewardText);
  const recruitCount = Math.max(0, Math.floor(item.recruit_count || 0));
  const applicantCount = Math.max(0, Math.floor(item.applicant_count || 0));
  const competitionRate = recruitCount > 0 ? applicantCount / recruitCount : 0;
  const [category, subCategory] = normalizeCategory(title, campaignType, rewardText);
  const brandName = title.match(/^[\(\[](.*?)[\)\]]/)?.[1] || null;

  const fallbackBase = (() => {
    if (/^https?:\/\//i.test(item.url)) {
      try {
        return new URL(item.url).origin;
      } catch {
        return "https://platform.example";
      }
    }
    return "https://platform.example";
  })();

  const keywordForMap = `${title} ${[depth1, depth2].filter(Boolean).join(" ")}`.trim();
  const shopUrl = toShopUrl(item.shop_url, keywordForMap || "campaign");
  let campaignUrl: string;
  try {
    campaignUrl = toAbsoluteUrl(item.url, fallbackBase);
  } catch {
    campaignUrl = `${fallbackBase.replace(/\/+$/, "")}/campaign/${encodeURIComponent(
      `${platformId}-${item.original_id}`,
    )}`;
  }

  const baseData = {
    title,
    brand_name: brandName,
    campaign_type: campaignType,
    media_type: mediaType,
    location: location || null,
    lat: geo.lat,
    lng: geo.lng,
    region_depth1: depth1,
    region_depth2: depth2,
    category,
    sub_category: subCategory,
    reward_text: rewardText || null,
    reward_value: rewardValue,
    thumbnail_url: normalizeText(item.thumbnail_url) || null,
    url: campaignUrl,
    shop_url: shopUrl,
    apply_end_date: item.apply_end_date,
    recruit_count: recruitCount,
    applicant_count: applicantCount,
    competition_rate: new Prisma.Decimal(competitionRate),
    brief_desc: item.brief_desc || null,
    tags: item.tags || null,
    updated_at: new Date(),
  };

  const existing = await db.campaign.findUnique({
    where: {
      platform_id_original_id: {
        platform_id: platformId,
        original_id: item.original_id,
      },
    },
    include: { snapshots: { orderBy: { scraped_at: "desc" }, take: 1 } },
  });

  if (!existing) {
    try {
      const created = await db.$transaction(async (tx) => {
        const inserted = await tx.campaign.create({
          data: {
            platform_id: platformId,
            original_id: item.original_id,
            ...baseData,
            snapshots: {
              create: {
                recruit_count: recruitCount,
                applicant_count: applicantCount,
                competition_rate: competitionRate,
              },
            },
          },
        });
        return inserted;
      });
      return { status: "created", id: created.id };
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const duplicated = await db.campaign.findFirst({
          where: {
            platform_id: platformId,
            OR: [{ original_id: item.original_id }, { url: campaignUrl }],
          },
          include: { snapshots: { orderBy: { scraped_at: "desc" }, take: 1 } },
        });
        if (!duplicated) throw err;

        await db.$transaction(async (tx) => {
          await tx.campaign.update({ where: { id: duplicated.id }, data: baseData });
          if (duplicated.recruit_count !== recruitCount || duplicated.applicant_count !== applicantCount) {
            await tx.campaignSnapshot.create({
              data: {
                campaign_id: duplicated.id,
                recruit_count: recruitCount,
                applicant_count: applicantCount,
                competition_rate: competitionRate,
              },
            });
          }
        });

        return duplicated.recruit_count !== recruitCount || duplicated.applicant_count !== applicantCount
          ? { status: "updated_with_snapshot", id: duplicated.id }
          : { status: "updated", id: duplicated.id };
      }
      throw err;
    }
  }

  const shouldCreateSnapshot =
    !existing.snapshots[0] ||
    existing.snapshots[0].recruit_count !== recruitCount ||
    existing.snapshots[0].applicant_count !== applicantCount;

  await db.$transaction(async (tx) => {
    await tx.campaign.update({ where: { id: existing.id }, data: baseData });
    const latest = existing.snapshots[0];
    if (!latest || latest.recruit_count !== recruitCount || latest.applicant_count !== applicantCount) {
      await tx.campaignSnapshot.create({
        data: {
          campaign_id: existing.id,
          recruit_count: recruitCount,
          applicant_count: applicantCount,
          competition_rate: competitionRate,
        },
      });
    }
  });

  return shouldCreateSnapshot ? { status: "updated_with_snapshot", id: existing.id } : { status: "updated", id: existing.id };
}
