import { Prisma } from "@prisma/client";

const KEYWORD_SYNONYMS: Record<string, string[]> = {
  사진: ["포토", "촬영", "포토그래퍼", "셀프"],
  체험: ["리뷰", "방문", "참여", "시승", "테스트"],
  숙박: ["펜션", "호텔", "풀빌라", "모텔", "게스트하우스"],
  여행: ["여행지", "여행형", "출장", "여행객", "숙소"],
  뷰티: ["미용", "코스메틱", "화장품", "헤어", "네일", "피부"],
  카페: ["커피숍", "디저트", "베이커리", "브런치", "카페형"],
  캠핑: ["캠프", "카라반", "차박", "캠프장"],
  포토: ["사진", "촬영", "사진촬영"],
  펜션: ["숙박", "풀빌라", "휴양"],
  부산: ["부산광역시", "해운대", "부산시"],
};

const TYPO_CORRECTIONS: Record<string, string> = {
  "부싼": "부산",
  "전주": "전주",
  "ㄴ원": "원",
  "헤어디": "헤어",
};

function normalizeToken(token: string): string {
  return token.trim().toLowerCase().replace(/["'`]/g, "");
}

export function buildSearchTokens(raw: string): string[] {
  const normalized = normalizeToken(raw || "");
  if (!normalized) return [];

  const words = normalized
    .split(/\s+/)
    .map((w) => TYPO_CORRECTIONS[w] || w)
    .flatMap((w) => [w, ...((KEYWORD_SYNONYMS[w] || []).map((s) => s.toLowerCase())])
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  return [...new Set(words)];
}

export function expandSearchCondition(token: string): string[] {
  return [token, ...((KEYWORD_SYNONYMS[token] || []).map((item) => item.toLowerCase())];
}

export function extractRegionsFromQuery(raw: string): string[] {
  const normalized = normalizeToken(raw || "");
  if (!normalized) return [];
  return normalized
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

export function buildKeywordAndFilters(rawQuery: string): Prisma.CampaignWhereInput[] {
  const tokens = buildSearchTokens(rawQuery);
  if (tokens.length === 0) return [];

  return tokens.map((token) => {
    const alternates = expandSearchCondition(token);
    return {
      OR: alternates.flatMap((term) => [
        { title: { contains: term, mode: "insensitive" } },
        { location: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
        { campaign_type: { contains: term, mode: "insensitive" } },
      ]),
    };
  });
}

export function bestCorrection(raw: string): string | null {
  const tokens = normalizeToken(raw).split(/\s+/);
  const corrected = tokens.map((t) => TYPO_CORRECTIONS[t] || t).join(" ");
  if (corrected && corrected !== normalizeToken(raw)) return corrected;
  return null;
}
