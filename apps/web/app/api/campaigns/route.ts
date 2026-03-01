import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

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
};

const MOCK_CAMPAIGNS = Array.from({ length: 24 }).map((_, i) => {
  const TITLES = [
    "강남 미슐랭 맛집 체험단", "홍대 감성 카페 브런치", "판교 IT기업 사무직 체험",
    "성수 수제 맥주 바 모집", "청담 프리미엄 스킨케어", "잠실 복합몰 쇼핑 체험",
    "여의도 파인다이닝 후기", "마포 브런치 카페 체험", "건대 야키니쿠 체험단",
    "종로 전통 한정식 모집", "신촌 네일아트 체험단", "이대 뷰티 샵 모집",
  ];
  const PLATFORMS = ["Revu", "ReviewNote", "DinnerQueen", "ReviewPlace", "Seouloppa"];
  const TYPES = ["VST", "VST", "VST", "SHP", "SHP", "PRS"];
  const MEDIAS = ["BP", "BP", "IP", "IP", "YP", "TK"];
  const REGIONS = [
    { d1: "서울", d2: "강남구", lat: 37.5172, lng: 127.0473 },
    { d1: "서울", d2: "마포구", lat: 37.5512, lng: 126.9334 },
    { d1: "서울", d2: "성동구", lat: 37.5633, lng: 127.0371 },
    { d1: "부산", d2: "해운대구", lat: 35.1587, lng: 129.1604 },
    { d1: "경기", d2: "성남시", lat: 37.4449, lng: 127.1388 },
  ];
  const region = REGIONS[i % REGIONS.length];
  const type = TYPES[i % TYPES.length];
  const recruit = Math.floor(Math.random() * 15) + 1;
  const applicants = Math.floor(Math.random() * 60) + 1;

  return {
    id: `mock-v2-${i}`,
    title: `[가상] ${TITLES[i % TITLES.length]} #${i + 1}`,
    campaign_type: type,
    media_type: MEDIAS[i % MEDIAS.length],
    category: ["식음료", "뷰티", "패션", "교육", "반려동물"][i % 5],
    location: `${region.d1} ${region.d2}`,
    region_depth1: region.d1,
    region_depth2: region.d2,
    lat: region.lat + (Math.random() - 0.5) * 0.05,
    lng: region.lng + (Math.random() - 0.5) * 0.05,
    reward_text: `${(Math.floor(Math.random() * 10) + 1) * 10}만원 상당`,
    reward_value: (Math.floor(Math.random() * 10) + 1) * 100000,
    recruit_count: recruit,
    applicant_count: applicants,
    competition_rate: applicants / recruit,
    apply_end_date: new Date(Date.now() + (Math.random() * 14 + 1) * 86400000).toISOString(),
    platform: { id: (i % 5) + 1, name: PLATFORMS[i % PLATFORMS.length] },
    thumbnail_url: `https://images.unsplash.com/photo-${[
      "1414235077428-338989a2e8c0", "1495474472287-4d71a6e81df2",
      "1567521464027-f127ff144326", "1551782450-17144efb9c50",
      "1559181567-c3190cdc20b8", "1507003211169-0a1dd7228f2d",
    ][i % 6]}?auto=format&fit=crop&w=400&q=80`,
  };
});

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get("campaign_type");
  const platform = sp.get("platform_id");
  const q = sp.get("q")?.toLowerCase();
  const region = sp.get("region_depth1");
  const minReward = Number(sp.get("min_reward") || 0);
  const maxComp = Number(sp.get("max_comp") || 999);
  const sort = sp.get("sort") || "latest_desc";
  const page = Number(sp.get("page") || 1);
  const limit = Number(sp.get("limit") || 24);

  // Import DB or fall back to mock
  let campaigns: MockCampaign[] = [];
  let total = 0;

  try {
    const { db } = await import("@/lib/db");
    const { buildCampaignsQuery } = await import("@/lib/queryBuilder");
    const qb = buildCampaignsQuery(sp);
    [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where: qb.where,
        orderBy: qb.orderBy as Prisma.CampaignOrderByWithRelationInput | Prisma.CampaignOrderByWithRelationInput[],
        skip: qb.skip, take: qb.take, include: { platform: true },
      }) as unknown as Promise<MockCampaign[]>,
      db.campaign.count({ where: qb.where }),
    ]);
    if (campaigns.length === 0) throw new Error("empty");
  } catch {
    // High-fidelity mock fallback engine
    const maxDeadlineDays = sp.get("max_deadline_days");
    let filtered: MockCampaign[] = [...MOCK_CAMPAIGNS];
    if (type) filtered = filtered.filter(c => c.campaign_type === type);
    if (platform) filtered = filtered.filter(c => c.platform.id === Number(platform));
    if (q) filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
    if (region) filtered = filtered.filter(c => c.region_depth1 === region);
    if (minReward) filtered = filtered.filter(c => c.reward_value >= minReward);
    if (maxComp < 999) filtered = filtered.filter(c => c.competition_rate <= maxComp);
    if (maxDeadlineDays) {
      const cutoff = Date.now() + Number(maxDeadlineDays) * 86400000;
      filtered = filtered.filter(c => new Date(c.apply_end_date).getTime() <= cutoff);
    }

    // Sort
    switch (sort) {
      case "deadline_asc": filtered.sort((a, b) => new Date(a.apply_end_date).getTime() - new Date(b.apply_end_date).getTime()); break;
      case "reward_desc": filtered.sort((a, b) => b.reward_value - a.reward_value); break;
      case "applicant_desc": filtered.sort((a, b) => b.applicant_count - a.applicant_count); break;
      case "competition_asc": filtered.sort((a, b) => a.competition_rate - b.competition_rate); break;
    }

    total = filtered.length;
    campaigns = filtered.slice((page - 1) * limit, page * limit);
  }

  return NextResponse.json({
    campaigns,
    total,
    meta: { page, limit, totalPages: Math.ceil(total / limit) },
  });
}
