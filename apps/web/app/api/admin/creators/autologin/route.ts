import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AUTOLOGIN_FAILURE_CODEBOOK } from "@/lib/adminAudit";

const POLICY_VERSION = "v2026.03.03.1";
const PROVIDER_PRIORITY = ["naver", "instagram", "youtube", "kakaotalk", "google"];
const STATE_SCORE: Record<string, number> = {
  connected: 0,
  needs_reauth: 1,
  disconnected: 2,
  error: 3,
};

type LoginCandidate = {
  reviewer_id: number;
  reviewer_name: string;
  provider: string;
  account_label: string | null;
  profile_name: string | null;
  auto_signin_enabled: boolean;
  auth_ready: boolean;
  connection_state: string;
  last_checked_at: string | null;
  provider_priority: number;
  decision_reason: string;
  failure_code: string | null;
  failure_label: string | null;
};

const formatFailureCode = (state: string) => {
  if (state === "needs_reauth") return "REAUTH_REQUIRED";
  if (state === "error") return "LOGIN_ERROR";
  if (state === "disconnected") return "NOT_CONNECTED";
  if (state === "connected") return "CONNECTED";
  return null;
};

const buildDecisionReason = (state: string, ready: boolean, autoSigninEnabled: boolean) => {
  if (!autoSigninEnabled) return "AUTO_SIGNIN_DISABLED";
  if (state === "connected" && ready) return "CONNECTED_READY";
  if (state === "needs_reauth") return "REAUTH_REQUIRED";
  if (state === "error") return "LOGIN_ERROR";
  return "NOT_READY";
};

const parseBool = (value: string | null) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const provider = searchParams.get("provider");
    const onlyReady = parseBool(searchParams.get("ready"));
    const q = searchParams.get("q")?.trim().toLowerCase();
    const includeNotReady = parseBool(searchParams.get("include_not_ready"));
    const providerPriority = searchParams.get("provider_priority")?.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    const priority = providerPriority && providerPriority.length > 0 ? providerPriority : PROVIDER_PRIORITY;

    const reviewers = await db.reviewer.findMany({
      where: {
        is_active: true,
      },
      include: {
        authCredentials: {
          orderBy: { provider: "asc" },
        },
      },
      orderBy: { updated_at: "desc" },
    });

    const candidates: LoginCandidate[] = reviewers.flatMap((reviewer) => {
      if (!reviewer.auto_signin_enabled) return [];
      const credentials = reviewer.authCredentials.filter((auth) => {
        if (provider && auth.provider !== provider) return false;
        if (!auth.is_auto_login) return false;
        if (includeNotReady !== true && onlyReady === null) return true;
        if (onlyReady === true && auth.connection_state !== "connected") return false;
        if (onlyReady === false && auth.connection_state === "connected") return false;
        return true;
      });
      if (credentials.length === 0) return [];

      return credentials.map((auth) => ({
        reviewer_id: reviewer.id,
        reviewer_name: reviewer.display_name,
        provider: auth.provider,
        account_label: auth.account_label,
        profile_name: auth.profile_name,
        auto_signin_enabled: auth.is_auto_login,
        auth_ready: auth.connection_state === "connected",
        connection_state: auth.connection_state,
        last_checked_at: auth.last_checked_at ? new Date(auth.last_checked_at).toISOString() : null,
        provider_priority: priority.indexOf(auth.provider) === -1 ? 99 : priority.indexOf(auth.provider),
        decision_reason: buildDecisionReason(auth.connection_state, auth.connection_state === "connected", auth.is_auto_login),
        failure_code: (() => {
          const code = formatFailureCode(auth.connection_state) as keyof typeof AUTOLOGIN_FAILURE_CODEBOOK | null;
          return code;
        })(),
        failure_label: (() => {
          const code = formatFailureCode(auth.connection_state) as keyof typeof AUTOLOGIN_FAILURE_CODEBOOK | null;
          return code ? AUTOLOGIN_FAILURE_CODEBOOK[code] : null;
        })(),
      }));
    });

    const filtered = q
      ? candidates.filter((item) => {
          const text = `${item.reviewer_name} ${item.provider} ${item.account_label || ""} ${item.profile_name || ""}`.toLowerCase();
          return text.includes(q);
        })
      : candidates;

    filtered.sort((a, b) => {
      if (a.auto_signin_enabled !== b.auto_signin_enabled) return a.auto_signin_enabled ? -1 : 1;
      if (a.auth_ready !== b.auth_ready) return a.auth_ready ? -1 : 1;
      if ((STATE_SCORE[a.connection_state] || 99) !== (STATE_SCORE[b.connection_state] || 99)) {
        return (STATE_SCORE[a.connection_state] || 99) - (STATE_SCORE[b.connection_state] || 99);
      }
      if (a.provider_priority !== b.provider_priority) return a.provider_priority - b.provider_priority;
      if (a.connection_state === "connected") {
        return (b.last_checked_at || "").localeCompare(a.last_checked_at || "");
      }
      return 0;
    });

    return NextResponse.json({
      policy_version: POLICY_VERSION,
      criteria: {
        reviewer_auto_signin_required: true,
        credential_auto_signin_required: true,
        provider_priority: priority,
      },
      candidates: filtered,
      total: filtered.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
