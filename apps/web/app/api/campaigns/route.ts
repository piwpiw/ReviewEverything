import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { buildGeoHintLabel, resolveCampaignCoordinates } from "@/lib/geo/campaignGeo";
type MockPlatform = { id: number; name: string };
type MockCampaign = {
  id: string;
  title: string;
  campaign_type: string;
  media_type: string;
  category: string;
  location: string;
  region_depth1: string;
  region_depth2: string;
  lat: number;
  lng: number;
  reward_text: string;
  reward_value: number;
  recruit_count: number;
  applicant_count: number;
  competition_rate: number;
  apply_end_date: string;
  platform: MockPlatform;
  thumbnail_url: string;
  url: string;
  shop_url?: string | null;
};

type Coord = { lat: number; lng: number };

const DEFAULT_LIMIT = 36;
const DEFAULT_MAP_LIMIT = 5000;
const GEO_MATCH_SUMMARY_DEBUG = process.env.NODE_ENV !== "production" || process.env.RE_VIEW_GEO_MATCH_DEBUG === "1";

const REGION_CENTERS: Record<string, Record<string, Coord>> = {
  서울: {
    "전체": { lat: 37.5665, lng: 126.978 },
    "강남구": { lat: 37.5172, lng: 127.0473 },
    "마포구": { lat: 37.5663, lng: 126.901 },
    "종로구": { lat: 37.5735, lng: 126.9788 },
    "default": { lat: 37.5665, lng: 126.978 },
  },
  부산: {
    "전체": { lat: 35.1796, lng: 129.0756 },
    "해운대구": { lat: 35.1587, lng: 129.1604 },
    "부산진구": { lat: 35.1586, lng: 129.0615 },
    "영도구": { lat: 35.0704, lng: 129.067 },
    "default": { lat: 35.1796, lng: 129.0756 },
  },
  대구: {
    "전체": { lat: 35.8714, lng: 128.6018 },
    "수성구": { lat: 35.8545, lng: 128.6205 },
    "달서구": { lat: 35.8704, lng: 128.6014 },
    "동구": { lat: 35.8756, lng: 128.5977 },
    "default": { lat: 35.8714, lng: 128.6018 },
  },
  인천: {
    "전체": { lat: 37.4563, lng: 126.7052 },
    "연수구": { lat: 37.5071, lng: 126.7218 },
    "중구": { lat: 37.4636, lng: 126.633 },
    "남동구": { lat: 37.4502, lng: 126.7368 },
    "default": { lat: 37.4563, lng: 126.7052 },
  },
  광주: {
    "전체": { lat: 35.1601, lng: 126.8514 },
    "북구": { lat: 35.173, lng: 126.893 },
    "서구": { lat: 35.152, lng: 126.8935 },
    "동구": { lat: 35.1372, lng: 126.924 },
    "default": { lat: 35.1601, lng: 126.8514 },
  },
  제주: {
    "전체": { lat: 33.4996, lng: 126.5312 },
    "제주시": { lat: 33.4996, lng: 126.5312 },
    "서귀포시": { lat: 33.2517, lng: 126.5601 },
    "default": { lat: 33.4996, lng: 126.5312 },
  },
};

const PLATFORM_ROWS: MockPlatform[] = [
  { id: 1, name: "Revu" },
  { id: 2, name: "Reviewnote" },
  { id: 3, name: "DinnerQueen" },
  { id: 4, name: "ReviewPlace" },
  { id: 5, name: "Seouloppa" },
  { id: 6, name: "MrBlog" },
  { id: 7, name: "GangnamFood" },
  { id: 8, name: "TastyTalk" },
  { id: 9, name: "Fooding" },
  { id: 10, name: "StyleReview" },
  { id: 11, name: "CreatorWave" },
  { id: 12, name: "TasteNow" },
  { id: 13, name: "NaverMap" },
];

const TYPE_ROWS = ["VST", "SHP", "PRS", "SNS", "EVT", "APP", "PRM", "ETC"];
const MEDIA_ROWS = ["BP", "IP", "YP", "RS", "SH", "TK", "CL", "RD", "FB", "X", "SN", "TT", "OTHER"];

const CATEGORIES: Record<string, string[]> = {
  all: ["브랜드", "제품", "이벤트", "콘텐츠", "리뷰", "후기", "체험단", "마케팅", "협찬", "영상", "라이브", "기획", "단기", "장기"],
  VST: ["브랜드", "체험단", "오픈이벤트", "SNS", "촬영", "콘텐츠", "기획"],
  SHP: ["판매", "샘플", "테스터", "광고", "시식", "협업", "콘텐츠"],
  PRS: ["PR", "홍보", "브랜딩", "캠페인", "콘텐츠", "협찬", "브랜드"],
  SNS: ["소셜", "UGC", "인스타", "릴레이", "라이브", "콘텐츠", "커뮤니티"],
  EVT: ["이벤트", "팝업", "런칭", "발표", "온오프라인", "캠페인"],
  APP: ["애플리케이션", "앱", "설치", "구매", "리워드", "광고"],
  PRM: ["프로모션", "제휴", "캠페인", "브랜딩", "제안", "협찬"],
  ETC: ["기타", "특가", "제공", "광고", "리워드"],
};

const REGIONS: Array<{ d1: string; d2: string }> = [
  { d1: "서울", d2: "전체" },
  { d1: "서울", d2: "강남구" },
  { d1: "서울", d2: "마포구" },
  { d1: "서울", d2: "종로구" },
  { d1: "부산", d2: "전체" },
  { d1: "부산", d2: "해운대구" },
  { d1: "부산", d2: "부산진구" },
  { d1: "부산", d2: "영도구" },
  { d1: "대구", d2: "전체" },
  { d1: "대구", d2: "수성구" },
  { d1: "대구", d2: "동구" },
  { d1: "인천", d2: "전체" },
  { d1: "인천", d2: "연수구" },
  { d1: "인천", d2: "중구" },
  { d1: "광주", d2: "전체" },
  { d1: "광주", d2: "북구" },
  { d1: "광주", d2: "동구" },
  { d1: "광주", d2: "서구" },
  { d1: "제주", d2: "전체" },
  { d1: "제주", d2: "제주시" },
  { d1: "제주", d2: "서귀포시" },
];

const TITLES = [
  "서울시 강남구 체험단 모집 캠페인",
  "신규 브랜딩 프로모션 모집 공고",
  "리워드형 숏폼 콘텐츠 제작 캠페인",
  "뷰티/라이프 리뷰어 모집 챌린지",
  "IT 체험단 정식 공지 및 모집",
  "푸드 테이스팅 후기 작성 제안",
  "패션 콘텐츠 촬영 제안 이벤트",
  "브랜드 협찬 샘플링 협업 제안",
  "로컬 상점 방문형 리뷰어 채용",
  "인플루언서 연계 SNS 챌린지",
  "SNS 릴레이 콘텐츠 제작 제안",
  "콘텐츠 성과형 광고 제안",
];

const IMG_POOL = [
  "1414235077428-338989a2e8c0",
  "1495474472287-4d71a6e81df2",
  "1567521464027-f127ff144326",
  "1551782450-17144efb9c50",
  "1559181567-c3190cdc20b8",
  "1507003211169-0a1dd7228f2d",
  "1534536281715-e28d76689b4d",
  "1600891964599-f61ba0e24092",
];

const toNum = (value: string | undefined, fallback: number) => {
  const v = Number(value);
  return Number.isFinite(v) ? v : fallback;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const regionCenter = (d1: string, d2: string): Coord => {
  const city = REGION_CENTERS[d1] || {};
  return city[d2] || city["전체"] || city[""] || { lat: 37.5665, lng: 126.978 };
};

const withFallbackCoords = (campaign: any) => {
  const region1 = campaign.region_depth1 || "서울";
  const region2 = campaign.region_depth2 || "전체";
  const resolved = resolveCampaignCoordinates({
    existingLat: campaign.lat,
    existingLng: campaign.lng,
    location: campaign.location,
    regionDepth1: region1,
    regionDepth2: region2,
    title: campaign.title,
    url: campaign.url,
    shopUrl: campaign.shop_url || campaign.shop_link || campaign.coupon_url,
  });
  const type = campaign.campaign_type || "ETC";
  const media = campaign.media_type || "OTHER";
  const sourceUrl = campaign.url || campaign.link || campaign.source_url || null;
  const shopUrl = campaign.shop_url || campaign.shop_link || campaign.coupon_url || null;

  return {
    ...campaign,
    campaign_type: type,
    media_type: media,
    region_depth1: region1,
    region_depth2: region2,
    lat: resolved.lat,
    lng: resolved.lng,
    geo_match_source: resolved.matchSource,
    geo_match_score: resolved.matchScore,
    geo_match_label: buildGeoHintLabel(resolved.matchSource),
    geo_store_key: resolved.storeKey,
    url: sourceUrl,
    shop_url: shopUrl,
  };
};

const summarizeGeoMatch = (campaigns: any[]) => {
  const source = new Map<string, number>();
  let missingStoreKey = 0;
  let missingSource = 0;
  let totalScore = 0;
  let scored = 0;
  let low = 0;
  let medium = 0;
  let high = 0;

  for (const campaign of campaigns) {
    const matchSource = campaign?.geo_match_source;
    const matchScore = campaign?.geo_match_score;
    const matchLabel = typeof matchSource === "string" && matchSource.trim() ? matchSource.trim() : "none";
    source.set(matchLabel, (source.get(matchLabel) || 0) + 1);

    if (!campaign?.geo_store_key) missingStoreKey += 1;
    if (!campaign?.geo_match_source) missingSource += 1;

    const score = Number(matchScore);
    if (Number.isFinite(score)) {
      totalScore += score;
      scored += 1;
      if (score >= 0.9) high += 1;
      else if (score >= 0.7) medium += 1;
      else low += 1;
    }
  }

  return {
    total: campaigns.length,
    missing_store_key: missingStoreKey,
    missing_source: missingSource,
    source_breakdown: Object.fromEntries(source.entries()),
    average_score: scored ? totalScore / scored : null,
    score_grade: { high, medium, low },
  };
};

const MOCK_CAMPAIGNS: MockCampaign[] = Array.from({ length: 1200 }).map((_, i) => {
  const type = TYPE_ROWS[i % TYPE_ROWS.length];
  const region = REGIONS[i % REGIONS.length];
  const rewardBase = [3, 5, 8, 10, 12, 15, 20, 30, 50, 70, 120];
  const reward = rewardBase[i % rewardBase.length];
  const recruit = clamp(Math.floor(Math.random() * 30) + 5, 3, 80);
  const applicants = clamp(Math.floor(Math.random() * Math.max(1, recruit)) + 1, 1, 200);
  const center = regionCenter(region.d1, region.d2);
  const jitterLat = (Math.random() - 0.5) * 0.04;
  const jitterLng = (Math.random() - 0.5) * 0.04;
  const catList = CATEGORIES[type] || CATEGORIES.all;

  return {
    id: `mock-v3-${i}`,
    title: `[${region.d1} ${region.d2}] ${TITLES[i % TITLES.length]} #${i + 1}`,
    campaign_type: type,
    media_type: MEDIA_ROWS[i % MEDIA_ROWS.length],
    category: catList[i % catList.length],
    location: `${region.d1} ${region.d2}`,
    region_depth1: region.d1,
    region_depth2: region.d2,
    lat: center.lat + jitterLat,
    lng: center.lng + jitterLng,
    reward_text: `${reward}원`,
    reward_value: reward * 10000,
    recruit_count: recruit,
    applicant_count: applicants,
    competition_rate: Number((applicants / recruit).toFixed(2)),
    apply_end_date: new Date(Date.now() + (Math.random() * 28 + 1) * 86_400_000).toISOString(),
    platform: PLATFORM_ROWS[i % PLATFORM_ROWS.length],
    thumbnail_url: `https://images.unsplash.com/photo-${IMG_POOL[i % IMG_POOL.length]}?auto=format&fit=crop&w=900&q=80`,
    url: `https://example.com/${encodeURIComponent((PLATFORM_ROWS[i % PLATFORM_ROWS.length].name || "platform").toLowerCase())}/campaign/${i + 1}`,
    shop_url: i % 2 === 0 ? "https://map.naver.com" : undefined,
  };
});

const FILTER_KEYS = ["q", "platform_id", "campaign_type", "media_type", "region_depth1", "region_depth2", "category", "min_reward", "max_comp", "max_deadline_days"];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("campaign_type");
  const platform = sp.get("platform_id");
  const q = sp.get("q")?.toLowerCase();
  const media = sp.get("media_type");
  const region1 = sp.get("region_depth1");
  const region2 = sp.get("region_depth2");
  const category = sp.get("category");
  const minReward = toNum(sp.get("min_reward") || undefined, 0);
  const maxComp = toNum(sp.get("max_comp") || undefined, 999999);
  const sort = sp.get("sort") || "latest_desc";
  const page = Math.max(1, toNum(sp.get("page") || undefined, 1));
  const rawLimit = toNum(sp.get("limit") || undefined, DEFAULT_LIMIT);
  const limit = Math.min(rawLimit > 0 ? rawLimit : DEFAULT_LIMIT, DEFAULT_MAP_LIMIT);
  const maxDeadlineDays = sp.get("max_deadline_days");

  let campaigns: any[] = [];
  let total = 0;

  try {
    const { db } = await import("@/lib/db");
    const { buildCampaignsQuery } = await import("@/lib/queryBuilder");
    const qb = buildCampaignsQuery(sp);
    const [rows, totalRows] = await Promise.all([
      db.campaign.findMany({
        where: qb.where,
        orderBy: qb.orderBy as Prisma.CampaignOrderByWithRelationInput | Prisma.CampaignOrderByWithRelationInput[],
        skip: qb.skip,
        take: qb.take,
        include: { platform: true },
      }) as unknown as Promise<any[]>,
      db.campaign.count({ where: qb.where }),
    ]);
    campaigns = rows.map(withFallbackCoords);
    if (GEO_MATCH_SUMMARY_DEBUG) {
      console.info("[campaigns] geo match summary", summarizeGeoMatch(campaigns));
    }
    total = totalRows;
    if (rows.length === 0) throw new Error("empty");
  } catch {
    let filtered = [...MOCK_CAMPAIGNS];

    if (type) filtered = filtered.filter((c) => c.campaign_type === type);
    if (platform) filtered = filtered.filter((c) => c.platform.id === Number(platform));
    if (media) {
      const values = media.split(",").map((v) => v.trim()).filter(Boolean);
      filtered = filtered.filter((c) => values.includes(c.media_type));
    }
    if (q) {
      filtered = filtered.filter(
        (c) => c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.category.toLowerCase().includes(q),
      );
    }
    if (region1) filtered = filtered.filter((c) => c.region_depth1 === region1);
    if (region2) filtered = filtered.filter((c) => c.region_depth2 === region2);
    if (category) filtered = filtered.filter((c) => c.category === category);
    if (minReward) filtered = filtered.filter((c) => c.reward_value >= minReward);
    if (maxComp < 999999) filtered = filtered.filter((c) => c.competition_rate <= maxComp);
    if (maxDeadlineDays) {
      const cutoff = Date.now() + Number(maxDeadlineDays) * 86_400_000;
      filtered = filtered.filter((c) => new Date(c.apply_end_date).getTime() <= cutoff);
    }

    switch (sort) {
      case "deadline_asc":
        filtered.sort((a, b) => new Date(a.apply_end_date).getTime() - new Date(b.apply_end_date).getTime());
        break;
      case "reward_desc":
        filtered.sort((a, b) => b.reward_value - a.reward_value);
        break;
      case "applicant_desc":
        filtered.sort((a, b) => b.applicant_count - a.applicant_count);
        break;
      case "competition_asc":
        filtered.sort((a, b) => a.competition_rate - b.competition_rate);
        break;
      case "competition_desc":
        filtered.sort((a, b) => b.competition_rate - a.competition_rate);
        break;
      case "latest_desc":
      default:
        filtered.sort((a, b) => new Date(b.apply_end_date).getTime() - new Date(a.apply_end_date).getTime());
        break;
    }

    filtered = filtered.map(withFallbackCoords);
    if (GEO_MATCH_SUMMARY_DEBUG) {
      console.info("[campaigns][mock] geo match summary", summarizeGeoMatch(filtered));
    }
    total = filtered.length;
    const offset = (page - 1) * limit;
    campaigns = filtered.slice(offset, offset + limit);
  }

  return NextResponse.json({
    campaigns,
    total,
    meta: {
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      filters: Object.fromEntries(FILTER_KEYS.map((k) => [k, sp.get(k)])),
      geo_match_summary: summarizeGeoMatch(campaigns),
    },
  });
}




