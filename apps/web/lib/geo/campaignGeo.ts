export type CampaignGeoInput = {
  existingLat?: string | number | null;
  existingLng?: string | number | null;
  location?: string | null;
  regionDepth1?: string | null;
  regionDepth2?: string | null;
  title?: string | null;
  url?: string | null;
  shopUrl?: string | null;
};

export type CampaignGeoMatch = {
  lat: number | null;
  lng: number | null;
  matchSource: "explicit" | "url_coords" | "region_center" | "heuristic";
  matchScore: number;
  storeKey?: string;
};

const STORE_KEY_STOP_WORDS = [
  "리뷰",
  "체험단",
  "캠페인",
  "이벤트",
  "신청",
  "모집",
  "리워드",
  "방문형",
  "배송형",
  "블로그",
  "인스타",
  "인스타그램",
  "네이버",
  "카카오",
  "쿠팡",
  "브랜드",
  "스토어",
  "제공",
  "체험",
  "광고",
  "참여",
  "체험형",
];

const STOP_WORD_SET = new Set(STORE_KEY_STOP_WORDS);

const CITY_CENTERS: Array<{ aliases: string[]; lat: number; lng: number }> = [
  { aliases: ["서울", "서울특별시", "seoul"], lat: 37.5665, lng: 126.978 },
  { aliases: ["부산", "부산광역시", "pusan", "busan"], lat: 35.1796, lng: 129.0756 },
  { aliases: ["인천", "인천광역시"], lat: 37.4563, lng: 126.7052 },
  { aliases: ["대구", "대구광역시"], lat: 35.8714, lng: 128.6014 },
  { aliases: ["광주", "광주광역시"], lat: 35.1601, lng: 126.8514 },
  { aliases: ["울산", "울산광역시"], lat: 35.5397, lng: 129.3114 },
  { aliases: ["제주", "제주도", "제주특별자치도", "jeju"], lat: 33.4996, lng: 126.5312 },
  { aliases: ["대전", "대전광역시"], lat: 36.3504, lng: 127.3845 },
  { aliases: ["세종", "세종특별자치시"], lat: 36.4801, lng: 127.2890 },
];

const DISTRICT_HINTS = new Map<string, [number, number]>([
  ["홍대", [37.5562, 126.9241]],
  ["강남", [37.5172, 127.0473]],
  ["잠실", [37.513, 127.100]],
  ["해운대", [35.1631, 129.1637]],
  ["부산", [35.1547, 129.0633]],
  ["송파", [37.5145, 127.1058]],
  ["서초", [37.4874, 127.0076]],
  ["마포", [37.5622, 126.9083]],
  ["종로", [37.573, 126.9794]],
  ["제주", [33.4996, 126.5312]],
]);

const HASH_MAX = 0xffffffff;

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function normalizedCoord(val: unknown): number | null {
  const num = Number(val);
  if (!Number.isFinite(num)) return null;
  return num;
}

function isValidCoord(lat: number, lng: number) {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function jitterBySeed(seed: number, range = 0.02): [number, number] {
  const s = (seed % HASH_MAX) / HASH_MAX;
  const angle = s * Math.PI * 2;
  const radius = ((seed >>> 8) % 1000) / 1000;
  const r = (radius * range) / 2;
  return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function toMatchText(value?: string | null): string {
  return (value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function parseFloatInRange(value?: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").trim();
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function extractCoordsFromSearchParams(rawUrl: string): [number | null, number | null] | null {
  try {
    const parsed = new URL(rawUrl);
    const lat = parseFloatInRange(parsed.searchParams.get("lat") || parsed.searchParams.get("latitude") || parsed.searchParams.get("latlng_lat"));
    const lng = parseFloatInRange(parsed.searchParams.get("lng") || parsed.searchParams.get("longitude") || parsed.searchParams.get("lon") || parsed.searchParams.get("longitude"));
    if (lat !== null && lng !== null && isValidCoord(lat, lng)) return [lat, lng];

    const x = parseFloatInRange(parsed.searchParams.get("x"));
    const y = parseFloatInRange(parsed.searchParams.get("y"));
    if (x !== null && y !== null) {
      if (isValidCoord(y, x)) return [y, x];
      if (isValidCoord(x, y)) return [x, y];
    }
  } catch {
    return null;
  }
  return null;
}

function extractCoordsFromText(rawUrl: string): [number | null, number | null] | null {
  const patterns = [
    /@(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /!2d(-?\d{1,3}\.\d+)!3d(-?\d{1,3}\.\d+)/,
    /(x|lng|lon)=(-?\d{1,3}\.\d+)&(y|lat)=(-?\d{1,3}\.\d+)/,
    /([-\d]{1,3}\.\d+),\s*([-\d]{1,3}\.\d+)/,
  ];

  for (const pattern of patterns) {
    const match = rawUrl.match(pattern);
    if (!match) continue;

    const values = match.slice(1).map((v) => parseFloat(v)).filter((v) => Number.isFinite(v));
    if (pattern.source.includes("!2d")) {
      const lng = values[0];
      const lat = values[1];
      if (isValidCoord(lat, lng)) return [lat, lng];
      continue;
    }
    if (pattern.source.includes("(x|lng|lon)")) {
      const a = values[0];
      const b = values[1];
      if (isValidCoord(b, a)) return [b, a];
      if (isValidCoord(a, b)) return [a, b];
      continue;
    }
    const [a, b] = values;
    if (Number.isFinite(a) && Number.isFinite(b)) {
      if (isValidCoord(a, b)) return [a, b];
      if (isValidCoord(b, a)) return [b, a];
    }
  }

  return null;
}

function extractCoordsFromLocationText(location?: string | null): [number | null, number | null] | null {
  if (!location) return null;
  const normalized = location.replace(/,/g, " ");
  const numbers = normalized.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/g);
  if (!numbers?.length) return null;

  const [, rawLat, rawLng] = normalized.match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/) || [];
  if (!rawLat || !rawLng) return null;
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!isValidCoord(lat, lng)) return null;
  return [lat, lng];
}

function resolveRegionCenter(depth1?: string | null, depth2?: string | null, location?: string): [number, number] | null {
  const text = `${depth1 || ""} ${depth2 || ""} ${location || ""}`.toLowerCase();

  for (const [district, coord] of DISTRICT_HINTS) {
    if (text.includes(district)) return coord;
  }

  for (const city of CITY_CENTERS) {
    if (city.aliases.some((alias) => text.includes(alias))) {
      return [city.lat, city.lng];
    }
  }

  return null;
}

function resolveStoreKey(title?: string | null, location?: string | null, shopUrl?: string | null, url?: string | null): string | undefined {
  const brandFromTitle = title?.match(/^[\(\[\{]([^)\]\}]+)[\)\]\}]/)?.[1];
  const candidates = [brandFromTitle, title, location, shopUrl, url].filter(Boolean) as string[];

  const normalizeRaw = (value: string) => {
    const text = value
      .replace(/https?:\/\/(www\.)?/, "")
      .replace(/[/?#].*$/, "")
      .replace(/\[[^\]]*]/g, "")
      .replace(/\([^)]+\)/g, "")
      .replace(/[\s|\\/:*?"<>]+/g, " ")
      .toLowerCase()
      .trim();

    return text
      .replace(/[^a-z0-9\uAC00-\uD7A3\s]/g, " ")
      .split(/\s+/)
      .map((part) => (STOP_WORD_SET.has(part) ? "" : part))
      .filter(Boolean)
      .join("")
      .slice(0, 72);
  };

  for (const candidate of candidates) {
    const value = normalizeRaw(candidate);
    if (value.length > 0) return value;
  }

  return undefined;
}

export function resolveCampaignCoordinates(input: CampaignGeoInput): CampaignGeoMatch {
  const candidateList = [input.shopUrl, input.url].filter(Boolean) as string[];
  const existingLat = normalizedCoord(input.existingLat);
  const existingLng = normalizedCoord(input.existingLng);
  if (existingLat !== null && existingLng !== null && isValidCoord(existingLat, existingLng)) {
    return {
      lat: existingLat,
      lng: existingLng,
      matchSource: "explicit",
      matchScore: 1,
      storeKey: resolveStoreKey(input.title, input.location, input.shopUrl, input.url),
    };
  }

  for (const url of candidateList) {
    const byParams = extractCoordsFromSearchParams(url);
    if (byParams && isValidCoord(byParams[0], byParams[1])) {
      return {
        lat: byParams[0],
        lng: byParams[1],
        matchSource: "url_coords",
        matchScore: 0.94,
        storeKey: resolveStoreKey(input.title, input.location, input.shopUrl, input.url),
      };
    }

    const byText = extractCoordsFromText(url);
    if (byText && isValidCoord(byText[0], byText[1])) {
      return {
        lat: byText[0],
        lng: byText[1],
        matchSource: "url_coords",
        matchScore: 0.91,
        storeKey: resolveStoreKey(input.title, input.location, input.shopUrl, input.url),
      };
    }
  }

  const byLocation = extractCoordsFromLocationText(input.location);
  if (byLocation && isValidCoord(byLocation[0], byLocation[1])) {
    return {
      lat: byLocation[0],
      lng: byLocation[1],
      matchSource: "url_coords",
      matchScore: 0.88,
      storeKey: resolveStoreKey(input.title, input.location, input.shopUrl, input.url),
    };
  }

  const cityCenter = resolveRegionCenter(input.regionDepth1, input.regionDepth2, input.location || "");
  if (cityCenter) {
    const seed = hashSeed(`${toMatchText(input.shopUrl)}|${toMatchText(input.title)}|${toMatchText(input.location)}|${toMatchText(input.regionDepth1)}|${toMatchText(input.regionDepth2)}`);
    const [dx, dy] = jitterBySeed(seed, 0.018);
    return {
      lat: cityCenter[0] + dx,
      lng: cityCenter[1] + dy,
      matchSource: "region_center",
      matchScore: 0.66,
      storeKey: resolveStoreKey(input.title, input.location, input.shopUrl, input.url),
    };
  }

  const fallbackSeed = hashSeed(toMatchText(input.title));
  const [dx, dy] = jitterBySeed(fallbackSeed, 0.05);
  const base = CITY_CENTERS[0];
  return {
    lat: base.lat + dx,
    lng: base.lng + dy,
    matchSource: "heuristic",
    matchScore: 0.25,
    storeKey: resolveStoreKey(input.title, input.location, input.shopUrl, input.url),
  };
}

export function buildGeoHintLabel(source: CampaignGeoMatch["matchSource"]) {
  switch (source) {
    case "explicit":
      return "좌표 직접 지정";
    case "url_coords":
      return "URL 좌표 추출";
    case "region_center":
      return "지역 중심 추정";
    default:
      return "거리 기반 추정";
  }
}
