type AuditMeta = Record<string, string | number | boolean | null>;

export const AUTOLOGIN_FAILURE_CODEBOOK = {
  REAUTH_REQUIRED: "재인증 필요",
  LOGIN_ERROR: "로그인/토큰 오류",
  NOT_CONNECTED: "연결 없음",
  CONNECTED: "정상 연결",
} as const;

export type AutoLoginFailureCode = keyof typeof AUTOLOGIN_FAILURE_CODEBOOK;

export type AdminAuditEvent = {
  action: "CREATOR_CREATE" | "CREATOR_UPDATE" | "CREATOR_DELETE";
  actor: string;
  targetId?: number;
  maskLevel?: "low" | "high";
  summary: string;
  meta?: AuditMeta;
};

const sanitizeValue = (value: unknown) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.length <= 4) return "***";
  return `${raw.slice(0, 3)}***${raw.slice(-2)}`;
};

const sanitizeMeta = (meta?: AuditMeta): AuditMeta | undefined => {
  if (!meta) return undefined;
  return Object.entries(meta).reduce<AuditMeta>((acc, [key, value]) => {
    if (["handle", "profile_url", "account_label", "profile_name"].includes(key)) {
      acc[key] = sanitizeValue(value);
      return acc;
    }
    acc[key] = value as AuditMeta[string];
    return acc;
  }, {});
};

export const emitAdminAuditLog = (event: AdminAuditEvent) => {
  const payload = {
    event: "admin_audit",
    action: event.action,
    actor: event.actor || "system",
    target_id: event.targetId ?? null,
    mask_level: event.maskLevel ?? "low",
    summary: event.summary,
    meta: sanitizeMeta(event.meta),
    logged_at: new Date().toISOString(),
  };
  console.info(`[admin-audit] ${JSON.stringify(payload)}`);
};
