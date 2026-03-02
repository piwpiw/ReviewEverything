import { Prisma } from "@prisma/client";
import { db } from "../lib/db";
import { ScrapedCampaign } from "./types";
import { resolveCampaignCoordinates } from "../lib/geo/campaignGeo";

const DISTRICT_COORDS: Record<string, [number, number]> = {
  서울: [37.5665, 126.978],
  강남구: [37.5172, 127.0473],
  서초구: [37.4837, 127.0324],
  종로구: [37.5735, 126.9788],
  중구: [37.5636, 126.9978],
  송파구: [37.5145, 127.1058],
  마포구: [37.5512, 126.9334],
  영등포구: [37.5262, 126.8945],
  성동구: [37.5633, 127.0371],
  광진구: [37.5388, 127.0822],
  관악구: [37.4784, 126.9516],
  강북구: [37.6467, 127.0145],
  중랑구: [37.5954, 127.0928],
  강서구: [37.5509, 126.8497],
  동작구: [37.5013, 126.9459],
  금천구: [37.4560, 126.8960],
  구로구: [37.4955, 126.8874],
  노원구: [37.6550, 127.0777],
  양천구: [37.5133, 126.8661],
  용산구: [37.5311, 126.9810],
  은평구: [37.6176, 126.9227],
  종로: [37.573, 126.978],
  부산: [35.1796, 129.0756],
  대구: [35.8714, 128.6014],
  인천: [37.4563, 126.7052],
};

const WIN = [
  ["visit", "방문", "현장", "오프라인"],
  ["delivery", "배송", "택배", "택배형", "퀵", "배달"],
  ["report", "기자단", "리포트", "보도", "취재"],
];

export function normalizeKoreanText(text: string): string {
  if (!text) return "";
  try {
    // Basic cleanup of common mojibake/broken chars
    return text
      .trim()
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
      .replace(/[^\x00-\x7F\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/g, "");
  } catch {
    return text;
  }
}

export function normalizeCampaignType(typeRaw: string): 'VST' | 'SHP' | 'PRS' {
  const norm = normalizeKoreanText(typeRaw).toLowerCase();

  if (WIN[0].some((s) => norm.includes(s.toLowerCase()))) return 'VST';
  if (WIN[1].some((s) => norm.includes(s.toLowerCase()))) return 'SHP';
  return 'PRS';
}

export function normalizeMediaType(mediaRaw: string): string {
  const norm = (mediaRaw || '').toLowerCase().trim();
  if (!norm) return 'OTHER';

  if (norm.includes('blog') || norm.includes('블로그')) return 'BP';
  if (norm.includes('instagram') || norm.includes('인스타') || norm.includes('insta')) return 'IP';
  if (norm.includes('youtube') || norm.includes('유튜브')) return 'YP';
  if (norm.includes('tiktok') || norm.includes('틱톡')) return 'TK';
  if (norm.includes('reels')) return 'RS';
  if (norm.includes('shorts')) return 'SH';
  if (norm.includes('clip')) return 'CL';

  return 'OTHER';
}

function pickNumbers(text: string) {
  const all = [] as number[];
  const normalized = text.replace(/,/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

  const add = (re: RegExp, factor: number) => {
    let m: RegExpExecArray | null;
    while ((m = re.exec(normalized)) !== null) {
      const value = parseFloat(m[1]);
      if (!Number.isNaN(value)) {
        all.push(Math.floor(value * factor));
      }
    }
  };

  // Layered regex strategy for Korean currency
  add(/(\d+(?:\.\d+)?)\s*억/g, 100000000);
  add(/(\d+(?:\.\d+)?)\s*만원/g, 10000);
  add(/(\d+(?:\.\d+)?)\s*만\s*원/g, 10000);
  add(/(\d+(?:\.\d+)?)\s*천원/g, 1000);
  add(/(\d+(?:\.\d+)?)\s*백만원/g, 1000000);
  add(/(\d+(?:\.\d+)?)\s*원/g, 1);
  add(/(\d+(?:\.\d+)?)\s*달러/g, 1300);
  add(/(\d+(?:\.\d+)?)\s*usd/g, 1300);

  // Handling cases like "10만" (without "원")
  add(/(\d+(?:\.\d+)?)\s*만(?!\s*원|\s*배|\s*개)/g, 10000);

  return Array.from(new Set(all));
}

export function normalizeRewardValue(text: string): number {
  if (!text) return 0;
  const raw = String(text);
  const values = pickNumbers(raw);

  if (values.length > 0) {
    // Return the maximum found value as likely primary reward
    return Math.max(...values);
  }

  // Fallback: look for 4+ consecutive digits which likely represent a KRW amount
  const fallback = raw.replace(/,/g, '').match(/(\d{4,})/);
  return fallback ? Number(fallback[1]) : 0;
}

export interface RewardParseResult {
  value: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  method: 'unit_parse' | 'fallback_number' | 'zero';
}

export function normalizeRewardValueWithConfidence(text: string): RewardParseResult {
  if (!text) return { value: 0, confidence: 'LOW', method: 'zero' };
  const raw = String(text);
  const values = pickNumbers(raw);
  const hasMultipleSignals = /[~\\-]|\\+|,/.test(raw);

  if (values.length > 0) {
    return {
      value: Math.max(...values),
      confidence: values.length === 1 || !hasMultipleSignals ? 'HIGH' : 'MEDIUM',
      method: 'unit_parse',
    };
  }

  const fallback = raw.replace(/,/g, '').match(/(\d{3,})/);
  if (fallback) {
    return { value: Number(fallback[1]), confidence: 'LOW', method: 'fallback_number' };
  }

  return { value: 0, confidence: 'LOW', method: 'zero' };
}

export function normalizeRegion(location: string): [string | null, string | null] {
  if (!location) return [null, null];
  const parts = String(location).split(/[\s,>/]+/).map((p) => p.trim()).filter(Boolean);
  const d1 = parts[0] || null;
  const d2 = parts[1] || null;
  return [d1, d2];
}

export function normalizeGeocode(location: string, d2: string | null): [number | null, number | null] {
  const resolved = resolveCampaignCoordinates({ location, regionDepth2: d2 });
  return [resolved.lat, resolved.lng];
}

export function extractBrandName(title: string): string | null {
  if (!title) return null;
  // Common patterns for brand names in Korean campaigns:
  // 1. [BrandName] Title
  // 2. (BrandName) Title
  // 3. BrandName - Title
  const matches = [
    title.match(/^\[([^\]]+)\]/),
    title.match(/^\(([^)]+)\)/),
    title.match(/^([^-\|]+)\s*[-\|]/),
  ];

  for (const m of matches) {
    if (m && m[1]) return m[1].trim();
  }

  // Fallback: take first 2-3 words if short
  const words = title.split(/\s+/);
  if (words.length > 0 && words[0].length >= 2) return words[0];

  return null;
}

export function normalizeCategory(title: string, type: string, reward: string): [string | null, string | null] {
  const combined = `${title || ''} ${reward || ''}`.toLowerCase();

  // Enhanced categorization for analytics
  if (combined.includes('맛집') || combined.includes('카페') || combined.includes('음식') || combined.includes('술집')) return ['식음료', '식사/안주'];
  if (combined.includes('화장품') || combined.includes('앰플') || combined.includes('기초') || combined.includes('메이크업')) return ['뷰티', '코스메틱'];
  if (combined.includes('헤어') || combined.includes('미용실') || combined.includes('네일')) return ['뷰티', '헤어/네일'];
  if (combined.includes('호텔') || combined.includes('펜션') || combined.includes('숙박') || combined.includes('여행')) return ['여행/숙박', '국내여행'];
  if (combined.includes('패션') || combined.includes('의류') || combined.includes('잡화')) return ['패션', '의류/잡화'];
  if (combined.includes('펫') || combined.includes('반려') || combined.includes('강아지') || combined.includes('고양이')) return ['반려동물', '펫용품'];
  if (combined.includes('육아') || combined.includes('키즈') || combined.includes('베이비')) return ['출산/육아', '영유아'];
  if (combined.includes('가전') || combined.includes('전자기기') || combined.includes('it')) return ['디지털/가전', 'it제품'];
  
  if (type === 'VST') return ['라이프', '공간체험'];
  return ['기타', '일반리뷰'];
}

export async function processAndDedupeCampaign(platformId: number, item: ScrapedCampaign) {
  const sanitizedTitle = normalizeKoreanText(item.title);
  const sanitizedReward = normalizeKoreanText(item.reward_text || '');
  const sanitizedLocation = normalizeKoreanText(item.location || '');

  const cType = normalizeCampaignType(item.campaign_type);
  const mType = normalizeMediaType(item.media_type);
  const rewardVal = normalizeRewardValue(sanitizedReward);
  const [depth1, depth2] = normalizeRegion(sanitizedLocation);
  const geo = resolveCampaignCoordinates({
    existingLat: item.lat,
    existingLng: item.lng,
    location: sanitizedLocation,
    regionDepth1: depth1,
    regionDepth2: depth2,
    title: sanitizedTitle,
    url: item.url,
    shopUrl: item.shop_url,
  });
  const [cat, subCat] = normalizeCategory(sanitizedTitle, cType, sanitizedReward);
  const bName = extractBrandName(sanitizedTitle);
  const compRate = item.recruit_count > 0 ? item.applicant_count / item.recruit_count : 0;

  const commonData = {
    title: sanitizedTitle,
    brand_name: bName,
    campaign_type: cType,
    media_type: mType,
    location: sanitizedLocation || null,
    lat: geo.lat,
    lng: geo.lng,
    region_depth1: depth1,
    region_depth2: depth2,
    category: cat,
    sub_category: subCat,
    reward_text: sanitizedReward || null,
    reward_value: rewardVal,
    thumbnail_url: item.thumbnail_url || null,
    url: item.url,
    shop_url: item.shop_url || null,
    apply_end_date: item.apply_end_date,
    recruit_count: item.recruit_count,
    applicant_count: item.applicant_count,
    competition_rate: compRate,
    updated_at: new Date(),
  };

  const existing = await db.campaign.findUnique({
    where: {
      platform_id_original_id: {
        platform_id: platformId,
        original_id: item.original_id,
      },
    },
    include: { snapshots: { orderBy: { scraped_at: 'desc' }, take: 1 } },
  });

  if (!existing) {
    try {
      const newCampaign = await db.campaign.create({
        data: {
          platform_id: platformId,
          original_id: item.original_id,
          ...commonData,
          snapshots: {
            create: {
              recruit_count: item.recruit_count,
              applicant_count: item.applicant_count,
              competition_rate: compRate,
            },
          },
        },
      });
      return { status: "created", id: newCampaign.id };
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const duplicateByUrl = await db.campaign.findFirst({
          where: {
            platform_id: platformId,
            url: item.url,
          },
          include: { snapshots: { orderBy: { scraped_at: "desc" }, take: 1 } },
        });
        if (duplicateByUrl) {
          const previousRecruit = duplicateByUrl.recruit_count;
          const previousApplicant = duplicateByUrl.applicant_count;
          await db.campaign.update({
            where: { id: duplicateByUrl.id },
            data: commonData,
          });

          if (previousRecruit !== item.recruit_count || previousApplicant !== item.applicant_count) {
            await db.campaignSnapshot.create({
              data: {
                campaign_id: duplicateByUrl.id,
                recruit_count: item.recruit_count,
                applicant_count: item.applicant_count,
                competition_rate: compRate,
              },
            });
            return { status: "updated_with_snapshot", id: duplicateByUrl.id };
          }
          return { status: "updated", id: duplicateByUrl.id };
        }
      }

      throw error;
    }
  }

  await db.campaign.update({
    where: { id: existing.id },
    data: commonData,
  });

  const lastSnapshot = existing.snapshots[0];
  const hasDataChanged =
    !lastSnapshot ||
    lastSnapshot.recruit_count !== item.recruit_count ||
    lastSnapshot.applicant_count !== item.applicant_count;

  if (hasDataChanged) {
    await db.campaignSnapshot.create({
      data: {
        campaign_id: existing.id,
        recruit_count: item.recruit_count,
        applicant_count: item.applicant_count,
        competition_rate: compRate,
      },
    });
    return { status: 'updated_with_snapshot', id: existing.id };
  }

  return { status: 'updated', id: existing.id };
}
