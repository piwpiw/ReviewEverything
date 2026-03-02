import { Prisma } from "@prisma/client";

function normalizeToken(token: string): string {
  return token.trim().toLowerCase().replace(/["'`]/g, "");
}

const KEYWORD_SYNONYMS: Record<string, string[]> = {
  review: ["후기", "리뷰", "리뷰어"],
  campaign: ["캠페인", "프로모션", "이벤트"],
  brand: ["브랜드", "브랜딩"],
  sns: ["소셜", "social", "인스타"],
  event: ["행사", "이벤트", "오픈"],
};

const TYPO_CORRECTIONS: Record<string, string> = {
  "리뷰어": "리뷰",
  "캠페인": "캠페인",
  "비슷함": "슷",
  "오픈챌린지": "오픈 챌린지",
};

export function buildSearchTokens(raw: string): string[] {
  const normalized = normalizeToken(raw || "");
  if (!normalized) return [];

  const words = normalized
    .split(/\s+/)
    .map((w) => TYPO_CORRECTIONS[w] || w)
    .flatMap((w) => [w, ...((KEYWORD_SYNONYMS[w] || []).map((s) => s.toLowerCase()))])
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  return [...new Set(words)];
}

export function expandSearchCondition(token: string): string[] {
  return [token, ...((KEYWORD_SYNONYMS[token] || []).map((item) => item.toLowerCase()))];
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

