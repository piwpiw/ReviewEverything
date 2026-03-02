import { NextRequest, NextResponse } from "next/server";

import { bestCorrection, buildSearchTokens } from "@/lib/search/searchUtils";
import { parseSearchQuery } from "@/lib/search/queryEnhancer";

const POPULAR_KEYWORDS = [
  "서울 강남",
  "서울 마포",
  "제주 펜션",
  "부산 해운대",
  "여행 블로그",
  "카페 창업",
  "반려동물 카페",
  "원데이 클래스",
  "뷰티 체험단",
  "유아 용품",
  "홈카페",
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const collect = (set: Set<string>, candidate: string | null | undefined, qTokens: string[]) => {
  if (!candidate) return;
  const cleaned = candidate.trim();
  if (!cleaned) return;
  const lowered = cleaned.toLowerCase();
  if (qTokens.length && !qTokens.some((token) => lowered.includes(token))) {
    return;
  }
  set.add(cleaned);
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawQ = sp.get("q")?.trim() || "";
  const limit = clamp(parseInt(sp.get("limit") || "8", 10) || 8, 1, 12);

  const q = rawQ.toLowerCase();
  const parsed = parseSearchQuery(q);
  const parsedText = parsed.keywordTokens.join(" ");
  const tokens = parsedText ? buildSearchTokens(parsedText) : [];
  const categoryTokens = parsed.categoryHints;
  const categoryQueryTokens = categoryTokens.join(" ");
  const correction = bestCorrection(q) || null;

  if (!rawQ) {
    return NextResponse.json({
      suggestions: POPULAR_KEYWORDS.slice(0, limit),
      correction: null,
      estimatedTotal: null,
    });
  }

  try {
    const { db } = await import("@/lib/db");
    const { buildCampaignsQuery } = await import("@/lib/queryBuilder");
    const qb = buildCampaignsQuery(sp);

    const [rows, count] = await Promise.all([
      db.campaign.findMany({
        where: qb.where,
        select: {
          title: true,
          location: true,
          category: true,
          platform: { select: { name: true } },
        },
        take: 80,
      }),
      db.campaign.count({ where: qb.where }),
    ]);

    const candidates = new Set<string>();
    for (const row of rows) {
      collect(candidates, row.title, tokens);
      collect(candidates, row.location, tokens);
      collect(candidates, row.category, tokens);
      collect(candidates, row.platform?.name, tokens);
    }
    for (const category of categoryTokens) {
      collect(candidates, category, categoryTokens);
    }

    const fromPopular = POPULAR_KEYWORDS.filter((keyword) => keyword.toLowerCase().includes(q) || q.includes(keyword.toLowerCase()));
    const suggestionCandidates = [...candidates, ...fromPopular].filter(Boolean);
    const suggestions = categoryQueryTokens
      ? suggestionCandidates.concat([categoryQueryTokens]).filter(Boolean)
      : suggestionCandidates;

    return NextResponse.json({
      suggestions: Array.from(new Set(suggestions)).slice(0, limit),
      correction,
      estimatedTotal: count,
    });
  } catch {
    const lowerTokens = tokens.map((token) => token.toLowerCase());
    const fallback = POPULAR_KEYWORDS.filter((keyword) => {
      const lower = keyword.toLowerCase();
      return lowerTokens.every((token) => lower.includes(token));
    });
    return NextResponse.json({
      suggestions: fallback.slice(0, limit),
      correction,
      estimatedTotal: null,
    });
  }
}
