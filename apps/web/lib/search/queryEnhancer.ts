export type SearchParseResult = {
  raw: string;
  normalized: string;
  regionDepth1?: string;
  regionDepth2?: string;
  keywordTokens: string[];
  categoryHints: string[];
  hasOnlyRegion: boolean;
};

const CITY_ALIASES: Record<string, string[]> = {
  서울: ["서울", "서울시", "서울특별시"],
  부산: ["부산", "부산시", "부산광역시"],
  경기: ["경기", "경기도", "서울근교", "수도권"],
  세종: ["세종", "세종시", "세종특별자치시"],
  인천: ["인천", "인천시", "인천광역시"],
  대구: ["대구", "대구시", "대구광역시"],
  대전: ["대전", "대전시", "대전광역시"],
  광주: ["광주", "광주시", "광주광역시"],
  제주: ["제주", "제주도", "제주특별자치도"],
  울산: ["울산", "울산시", "울산광역시"],
};

const DISTRICT_ALIASES: Record<string, Record<string, string>> = {
  서울: {
    "강남구": "강남",
    "강남": "강남",
    "홍대": "홍대",
    "명동": "명동",
    "이태원": "이태원",
    "서초구": "서초",
    "서초": "서초",
    "잠실": "잠실",
    "영등포구": "영등포",
    "영등포": "영등포",
  },
  부산: {
    "해운대구": "해운대",
    "해운대": "해운대",
    "서면": "서면",
    "남포동": "남포동",
    "광안리": "광안리",
    "연산구": "연산",
    "연산": "연산",
  },
  인천: {
    "송도": "송도",
    "부평구": "부평",
    "부평": "부평",
  },
  대구: {
    "동성로": "동성로",
  },
  제주: {
    "제주시": "제주",
    "제주": "제주",
    "서귀포시": "서귀포",
    "서귀포": "서귀포",
  },
};

const CATEGORY_HINTS: Record<string, string[]> = {
  숙박: ["펜션", "호텔", "풀빌라", "리조트", "숙박", "숙소"],
  뷰티: ["헤어", "네일", "메이크업", "스킨", "피부", "마사지", "뷰티", "미용"],
  식음료: ["카페", "디저트", "맛집", "음식", "브런치", "요리", "식음"],
  여행: ["여행", "바다", "캠핑", "펜션", "해변", "크루즈", "관광"],
  생활: ["인테리어", "살림", "청소", "생활", "집안", "리폼"],
  교육: ["클래스", "강좌", "레슨", "교육", "원데이", "공부"],
};

function normalizeQuery(raw: string): string {
  return String(raw || "")
    .toLowerCase()
    .replace(/[,./!?()[\]{}"'`~^|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToken(token: string): string {
  return token.trim().toLowerCase();
}

function dedupe<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean))];
}

function findCity(tokens: string[]): string | undefined {
  for (const token of tokens) {
    if (!token) continue;
    for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
      if (aliases.includes(token)) return city;
    }
    if (CITY_ALIASES[token.toUpperCase() as keyof typeof CITY_ALIASES]) return token;
  }
  return undefined;
}

function findDistrict(city: string, tokens: string[]): string | undefined {
  const entries = DISTRICT_ALIASES[city];
  if (!entries) return undefined;
  for (const token of tokens) {
    if (!token) continue;
    if (entries[token]) return entries[token];
  }
  return undefined;
}

function findCityByDistrict(tokens: string[]): string | undefined {
  for (const token of tokens) {
    for (const [city, entries] of Object.entries(DISTRICT_ALIASES)) {
      if (entries[token]) return city;
    }
  }
  return undefined;
}

function extractCategoryHints(tokens: string[]): { categories: string[]; usedTokens: string[] } {
  const categories = [] as string[];
  const usedTokens = [] as string[];
  for (const token of tokens) {
    for (const [category, aliases] of Object.entries(CATEGORY_HINTS)) {
      if (aliases.includes(token)) {
        usedTokens.push(token);
        if (!categories.includes(category)) categories.push(category);
      }
    }
  }
  return { categories: dedupe(categories), usedTokens: dedupe(usedTokens) };
}

export function parseSearchQuery(raw: string): SearchParseResult {
  const normalized = normalizeQuery(raw);
  if (!normalized) {
    return {
      raw,
      normalized: "",
      keywordTokens: [],
      categoryHints: [],
      hasOnlyRegion: false,
    };
  }

  const words = normalized.split(" ").map(normalizeToken).filter(Boolean);
  const used = new Set<string>();
  const cityFromToken = findCity(words);
  const cityFromDistrict = cityFromToken ? undefined : findCityByDistrict(words);
  const city = cityFromToken || cityFromDistrict;

  if (city) {
    for (const alias of CITY_ALIASES[city]) used.add(alias);
    used.add(city);
  }

  const district = city ? findDistrict(city, words) : undefined;
  if (district) used.add(district);

  const remaining = words.filter((w) => !used.has(w));

  const { categories: categoryHints, usedTokens: categoryUsedTokens } = extractCategoryHints(remaining);
  const keywordTokens = dedupe(remaining.filter((token) => token.length > 1 && !categoryUsedTokens.includes(token)));

  const hasOnlyRegion =
    words.length > 0 &&
    !keywordTokens.length &&
    (!remaining.filter((word) => !used.has(word)).length || remaining.every((word) => used.has(word)));

  return {
    raw,
    normalized,
    regionDepth1: city,
    regionDepth2: district,
    keywordTokens,
    categoryHints,
    hasOnlyRegion,
  };
}

export function getCategoryQueryClauses(categoryHints: string[]) {
  const hints = dedupe((categoryHints || []).filter((item) => item && item.length > 0));
  if (!hints.length) return [];
  return hints.map((category) => ({
    category: { contains: category, mode: "insensitive" as const },
  }));
}
