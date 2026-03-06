const URL_PRECEDENCE = /^https?:\/\/|^\/\//i;

const FORBIDDEN_SCHEMES = /^(javascript|data|vbscript):/i;

const normalizeValue = (value: string) => {
  const trimmed = value.trim().replace(/[\u0000-\u001f]/g, "");
  return trimmed.replace(/\s+/g, "").replace(/^["'`]|["'`]$/g, "");
};

export function normalizeCampaignUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const value = normalizeValue(raw);
  if (!value || value === "#") return null;
  if (FORBIDDEN_SCHEMES.test(value)) return null;

  if (URL_PRECEDENCE.test(value)) {
    return value.startsWith("//") ? `https:${value}` : value;
  }

  if (value.includes("://") && !value.startsWith("http://") && !value.startsWith("https://")) {
    return null;
  }

  if (value.startsWith("/")) return value;

  const domainLike = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/;
  if (domainLike.test(value)) {
    return `https://${value}`;
  }

  const withProtocol = `https://${value}`;
  try {
    const parsed = new URL(withProtocol);
    return parsed.toString();
  } catch {
    return null;
  }
}

export function hasCampaignUrl(raw: string | null | undefined): boolean {
  return Boolean(normalizeCampaignUrl(raw));
}
