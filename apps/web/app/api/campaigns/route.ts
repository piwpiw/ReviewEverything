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
  ?쒖슱: {
    "媛뺣궓援?: { lat: 37.5172, lng: 127.0473 },
    "?≫뙆援?: { lat: 37.5146, lng: 127.1095 },
    "媛뺤꽌援?: { lat: 37.5632, lng: 126.8248 },
    "醫낅줈援?: { lat: 37.5742, lng: 126.9767 },
    "留덊룷援?: { lat: 37.5499, lng: 126.9148 },
    "?꾩껜": { lat: 37.5665, lng: 126.978 },
    "": { lat: 37.5665, lng: 126.978 },
  },
  遺?? {
    "?댁슫?援?: { lat: 35.1587, lng: 129.1604 },
    "遺?곗쭊援?: { lat: 35.1586, lng: 129.0615 },
    "?섏쁺援?: { lat: 35.1705, lng: 129.1136 },
    "?숇옒援?: { lat: 35.2059, lng: 129.0872 },
    "?꾩껜": { lat: 35.1796, lng: 129.0756 },
    "": { lat: 35.1796, lng: 129.0756 },
  },
  ?援? {
    "以묎뎄": { lat: 35.8704, lng: 128.6014 },
    "?섏꽦援?: { lat: 35.8277, lng: 128.6317 },
    "?숆뎄": { lat: 35.8756, lng: 128.5977 },
    "?꾩껜": { lat: 35.8714, lng: 128.6018 },
    "": { lat: 35.8714, lng: 128.6018 },
  },
  ?몄쿇: {
    "遺?됯뎄": { lat: 37.5071, lng: 126.7218 },
    "?곗닔援?: { lat: 37.4177, lng: 126.6782 },
    "以묎뎄": { lat: 37.4731, lng: 126.6292 },
    "?꾩껜": { lat: 37.4563, lng: 126.7052 },
    "": { lat: 37.4563, lng: 126.7052 },
  },
  寃쎄린?? {
    "?섏썝??: { lat: 37.2636, lng: 127.0286 },
    "?깅궓??: { lat: 37.4449, lng: 127.1388 },
    "?⑹씤??: { lat: 37.2411, lng: 127.1776 },
    "?꾩껜": { lat: 37.4138, lng: 127.5183 },
    "": { lat: 37.4138, lng: 127.5183 },
  },
  ?쒖＜?? {
    "?쒖＜??: { lat: 33.4996, lng: 126.5312 },
    "?쒓??ъ떆": { lat: 33.2517, lng: 126.5601 },
    "?꾩껜": { lat: 33.4996, lng: 126.5312 },
    "": { lat: 33.4996, lng: 126.5312 },
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
  all: ["?앹쓬猷?, "酉고떚", "?⑥뀡", "?쇱씠??, "媛??, "?ы뻾", "?뚰겕", "援먯쑁", "怨듭뿰", "??, "臾명솕", "湲덉쑖", "遺?숈궛", "寃뚯엫", "?ㅽ룷痢?, "湲고?"],
  VST: ["?앹쓬猷?, "移댄럹", "釉뚮옖??泥댄뿕", "?꾩떆/?됱궗", "愿愿?, "?ы뻾", "吏???먮갑", "??, "?ㅽ뵂?곗묶", "湲고?"],
  SHP: ["?⑥뀡", "酉고떚", "?앺뭹", "由щ튃", "?붿???, "?덉눥??, "援щ룆", "?앺솢", "?꾩옄湲곌린", "媛援?, "湲고?"],
  PRS: ["釉뚮옖??PR", "誘몃뵒??, "?뚰겕", "援먯쑁", "吏???뱀쭛", "湲곌린 由щ럭", "蹂대룄??, "愿묎퀬??, "湲고?"],
  SNS: ["?몄뒪?洹몃옩", "?좏뒠釉?, "?륂뤌", "?쇱씠釉?, "UGC", "而ㅻ??덊떚", "釉뚯씠濡쒓렇", "湲고?"],
  EVT: ["?ㅽ봽?쇱씤 ?대깽??, "?앹뾽 ?ㅽ넗??, "泥댄뿕??, "?뚮쭏 ?됱궗", "諛뺣엺??, "湲고?"],
  APP: ["???ㅼ튂??, "硫ㅻ쾭??, "援щℓ??, "釉뚮옖???쒗쑕", "由ъ썙?쒗삎", "?곕룞??, "湲고?"],
  PRM: ["愿묎퀬??, "釉뚮옖??罹좏럹??, "吏???뱀쭛", "?쒗뭹 ?띾낫", "?꾨줈紐⑥뀡", "?명뵆猷⑥뼵???묒뾽", "湲고?"],
  ETC: ["?ъ씤?명삎", "荑좏룿??, "湲고?", "泥댄뿕??, "由ъ썙?쒗삎"],
};

const REGIONS: Array<{ d1: string; d2: string }> = [
  { d1: "?쒖슱", d2: "媛뺣궓援? },
  { d1: "?쒖슱", d2: "?≫뙆援? },
  { d1: "?쒖슱", d2: "醫낅줈援? },
  { d1: "?쒖슱", d2: "留덊룷援? },
  { d1: "遺??, d2: "?댁슫?援? },
  { d1: "遺??, d2: "遺?곗쭊援? },
  { d1: "遺??, d2: "?섏쁺援? },
  { d1: "遺??, d2: "?숇옒援? },
  { d1: "?援?, d2: "以묎뎄" },
  { d1: "?援?, d2: "?섏꽦援? },
  { d1: "?援?, d2: "?숆뎄" },
  { d1: "?몄쿇", d2: "?곗닔援? },
  { d1: "?몄쿇", d2: "遺?됯뎄" },
  { d1: "?몄쿇", d2: "以묎뎄" },
  { d1: "寃쎄린??, d2: "?섏썝?? },
  { d1: "寃쎄린??, d2: "?깅궓?? },
  { d1: "寃쎄린??, d2: "?⑹씤?? },
  { d1: "寃쎄린??, d2: "怨쇱쿇?? },
  { d1: "?쒖＜??, d2: "?쒖＜?? },
  { d1: "?쒖＜??, d2: "?쒓??ъ떆" },
  { d1: "媛뺤썝??, d2: "異섏쿇?? },
  { d1: "異⑹껌?⑤룄", d2: "泥쒖븞?? },
  { d1: "異⑹껌遺곷룄", d2: "泥?＜?? },
  { d1: "?꾨씪遺곷룄", d2: "?꾩＜?? },
  { d1: "?꾨씪?⑤룄", d2: "?쒖쿇?? },
  { d1: "寃쎌긽遺곷룄", d2: "?ы빆?? },
  { d1: "寃쎌긽?⑤룄", d2: "李쎌썝?? },
  { d1: "?몄궛", d2: "?④뎄" },
  { d1: "???, d2: "?좎꽦援? },
  { d1: "愿묒＜", d2: "?숆뎄" },
  { d1: "?몄쥌", d2: "?곌린援? },
];

const TITLES = [
  "由щ럭??紐⑥쭛 - 留쏆쭛 泥댄뿕???좎갑??,
  "酉고떚 泥댄뿕 - ?좎긽 ?쒗뭹 ?ㅽ뵂 由щ럭 ?대깽??,
  "釉뚮옖???띾낫 湲곗궗??罹좏럹??李몄뿬",
  "?ㅽ봽?쇱씤 留ㅼ옣 諛⑸Ц???대깽??,
  "IT 湲곌린 泥댄뿕???섎떦 吏湲??대깽??,
  "諛섎젮?숇Ъ 移댄럹 ?쒖떇 ?대깽??,
  "?붿???援우쫰 利앹젙??由щ럭 ?대깽??,
  "?좏뒠釉?珥ъ쁺 吏?먰삎 泥댄뿕??,
  "?좉퇋 留ㅼ옣 諛⑸Ц ?대깽??,
  "?⑥뀡 ?꾩씠??李⑹슜 ?꾧린 紐⑥쭛",
  "?쇱씠?꾩뒪???肄섑뀗痢??쒖옉??,
  "吏???뱁솕 ?ㅽ럹???꾨줈紐⑥뀡",
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
  return city[d2] || city[""] || city["?꾩껜"] || { lat: 37.5665, lng: 126.978 };
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
  const sourceUrl = campaign.url || campaign.link || campaign.source_url || `https://example.com/campaigns/${campaign.id}`;
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
    reward_text: `${reward}留뚯썝`,
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



