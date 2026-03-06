export const DEFAULT_DDAY_DAYS = 7;
export const DEFAULT_RECRUIT_COUNT = 5;
export const DEFAULT_APPLICANT_COUNT = 0;

export const sleep = (ms: number) => {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function normalizeText(value: unknown): string {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseIntSafe(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(String(value || "").replace(/,/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

export function parseDdayDays(raw: string | undefined, fallback = DEFAULT_DDAY_DAYS): number {
  const match = /D-?\s*(\d+)/i.exec(normalizeText(raw || ""));
  if (!match) return fallback;
  const day = parseIntSafe(match[1], fallback);
  return Math.max(day, 1);
}

export function pickText($el: { text: () => string }): string {
  return normalizeText($el.text());
}

export function absoluteUrl(base: string, raw: string): string {
  if (!raw) return base;
  if (/^https?:\/\//i.test(raw)) return normalizeTrackedUrl(raw);
  if (raw.startsWith("//")) return normalizeTrackedUrl(`https:${raw}`);
  const normalizedPath = raw.startsWith("/") ? raw : `/${raw}`;
  return normalizeTrackedUrl(`${base.replace(/\/+$/, "")}${normalizedPath}`);
}

function normalizeTrackedUrl(raw: string): string {
  try {
    const parsed = new URL(normalizeText(raw));
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return raw.replace(/\/$/, "");
  }
}

export function extractImageUrl(base: string, raw: string | undefined): string | undefined {
  const img = normalizeText(raw || "");
  if (!img) return undefined;
  return absoluteUrl(base, img);
}

export function buildDdayDate(daysFromNow: number): Date {
  const ms = Math.max(daysFromNow, 1) * 86_400_000;
  return new Date(Date.now() + ms);
}
