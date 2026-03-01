import { db } from "../lib/db";
import { ScrapedCampaign } from "./types";

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
      const value = Number(m[1]);
      if (!Number.isNaN(value)) all.push(Math.floor(value * factor));
    }
  };

  add(/(\d+(?:\.\d+)?)\s*만원/g, 10000);
  add(/(\d+(?:\.\d+)?)\s*천원/g, 1000);
  add(/(\d+(?:\.\d+)?)\s*백만원/g, 1000000);
  add(/(\d+(?:\.\d+)?)\s*원/g, 1);
  add(/(\d+(?:\.\d+)?)\s*달러/g, 1300);

  return all;
}

export function normalizeRewardValue(text: string): number {
  if (!text) return 0;
  const raw = String(text);
  const values = pickNumbers(raw);

  if (values.length > 0) return Math.max(...values);

  const fallback = raw.replace(/,/g, '').match(/(\d{3,})/);
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

  if (values.length > 0) {
    return {
      value: Math.max(...values),
      confidence: values.length === 1 ? 'HIGH' : 'MEDIUM',
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
  if (!location) return [null, null];
  const key = Object.keys(DISTRICT_COORDS).find((district) => location.includes(district) || (d2 && d2.includes(district)));
  if (key) {
    const [lat, lng] = DISTRICT_COORDS[key];
    return [lat + (Math.random() - 0.5) * 0.01, lng + (Math.random() - 0.5) * 0.01];
  }
  return [null, null];
}

export function normalizeCategory(title: string, type: string, reward: string): [string | null, string | null] {
  const combined = `${title || ''} ${reward || ''}`.toLowerCase();

  if (type === 'VST') {
    if (combined.includes('맛집') || combined.includes('카페') || combined.includes('음식')) return ['식음료', '식사'];
    if (combined.includes('미용') || combined.includes('뷰티') || combined.includes('헤어')) return ['뷰티', '미용'];
    if (combined.includes('쇼핑') || combined.includes('상품') || combined.includes('구매')) return ['쇼핑', '상품'];
    if (combined.includes('숙박') || combined.includes('호텔')) return ['여행', '숙박'];
    return ['라이프', '라이프스타일'];
  }

  if (combined.includes('교육') || combined.includes('교육체험')) return ['교육', '리뷰'];
  if (combined.includes('뷰티') || combined.includes('메이크업')) return ['뷰티', '케어'];
  if (combined.includes('펫') || combined.includes('반려') || combined.includes('동물')) return ['반려동물', '체험'];
  return ['기타', '기타'];
}

export async function processAndDedupeCampaign(platformId: number, item: ScrapedCampaign) {
  const sanitizedTitle = normalizeKoreanText(item.title);
  const sanitizedReward = normalizeKoreanText(item.reward_text || '');
  const sanitizedLocation = normalizeKoreanText(item.location || '');

  const cType = normalizeCampaignType(item.campaign_type);
  const mType = normalizeMediaType(item.media_type);
  const rewardVal = normalizeRewardValue(sanitizedReward);
  const [depth1, depth2] = normalizeRegion(sanitizedLocation);
  const [lat, lng] = normalizeGeocode(sanitizedLocation, depth2);
  const [cat, subCat] = normalizeCategory(sanitizedTitle, cType, sanitizedReward);

  const compRate = item.recruit_count > 0 ? item.applicant_count / item.recruit_count : 0;

  const commonData = {
    title: sanitizedTitle,
    campaign_type: cType,
    media_type: mType,
    location: sanitizedLocation || null,
    lat: item.lat || lat,
    lng: item.lng || lng,
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
    return { status: 'created', id: newCampaign.id };
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
