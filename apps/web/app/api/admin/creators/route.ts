import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitAdminAuditLog } from "@/lib/adminAudit";

const PROVIDERS = ["naver", "instagram", "youtube", "kakaotalk", "google"];
const CONNECTION_STATES = ["connected", "disconnected", "needs_reauth", "error"] as const;
const SORT_OPTIONS = ["updated_desc", "updated_asc", "name_asc", "name_desc", "auto_signin"] as const;

type ConnectionState = (typeof CONNECTION_STATES)[number];

type RawConnection = {
  provider: string;
  account_label?: string | null;
  profile_name?: string | null;
  auth_mode?: string;
  auth_hint?: string | null;
  connection_state?: string;
  is_auto_login?: boolean;
  is_primary?: boolean;
  vault_ref?: string | null;
};

const normalizeConnectionState = (state: unknown): ConnectionState => {
  const normalized = String(state || "disconnected").trim().toLowerCase();
  return (CONNECTION_STATES as readonly string[]).includes(normalized)
    ? (normalized as ConnectionState)
    : "disconnected";
};

type RawReviewer = {
  display_name?: string;
  handle?: string | null;
  profile_url?: string | null;
  notes?: string | null;
  is_active?: boolean;
  auto_signin_enabled?: boolean;
  status_note?: string | null;
  authCredentials?: RawConnection[] | { [key: string]: string };
};

const normalizeConnection = (input: RawConnection) => {
  const provider = String(input?.provider || "").trim().toLowerCase();
  if (!provider || !PROVIDERS.includes(provider)) {
    return null;
  }

  return {
    provider,
    account_label: (input.account_label || "").trim() || null,
    profile_name: (input.profile_name || "").trim() || null,
    auth_mode: (input.auth_mode || "oauth").trim() || "oauth",
    auth_hint: (input.auth_hint || "").trim() || null,
    connection_state: normalizeConnectionState(input.connection_state),
    is_auto_login: input.is_auto_login !== false,
    is_primary: !!input.is_primary,
    expires_at: null as Date | null,
  };
};

const parseIncoming = (payload: RawReviewer): RawReviewer => ({
  display_name: (payload.display_name || "").trim(),
  handle: payload.handle === undefined ? null : (payload.handle || "").trim() || null,
  profile_url: payload.profile_url === undefined ? null : (payload.profile_url || "").trim() || null,
  notes: payload.notes === undefined ? null : (payload.notes || "").trim() || null,
  is_active: payload.is_active ?? true,
  auto_signin_enabled: payload.auto_signin_enabled ?? true,
  status_note: payload.status_note === undefined ? null : (payload.status_note || "").trim() || null,
  authCredentials: [],
});

const normalizePayloadToItems = (payload: unknown): RawReviewer[] => {
  if (!payload || typeof payload !== "object") return [];
  const raw = payload as { items?: unknown; [key: string]: unknown };

  if (Array.isArray(raw.items)) {
    return (raw.items as RawReviewer[])
      .map((item) => item || {})
      .map((item) => parseIncoming(item))
      .filter((item) => Boolean(item.display_name));
  }

  const single = parseIncoming(raw as RawReviewer);
  return single.display_name ? [single] : [];
};

const normalizeConnections = (rawConnections: RawReviewer["authCredentials"]) => {
  if (!Array.isArray(rawConnections)) return [];

  const byProvider = new Map<string, ReturnType<typeof normalizeConnection>>();
  for (const item of rawConnections) {
    const normalized = normalizeConnection(item);
    if (!normalized) continue;
    byProvider.set(normalized.provider, normalized);
  }

  return Array.from(byProvider.values()).filter(Boolean) as Array<{
    provider: string;
    account_label: string | null;
    profile_name: string | null;
    auth_mode: string;
    auth_hint: string | null;
    connection_state: string;
    is_auto_login: boolean;
    is_primary: boolean;
    expires_at: Date | null;
  }>;
};

const normalizeSort = (rawSort: string | null) => {
  const sort = rawSort?.trim() || "updated_desc";
  return (SORT_OPTIONS as readonly string[]).includes(sort) ? sort : "updated_desc";
};

const compareCreatorAutoSignIn = (left: CreatorSummary, right: CreatorSummary) => {
  if (left.auto_signin_enabled !== right.auto_signin_enabled) {
    return left.auto_signin_enabled ? -1 : 1;
  }
  if (left.auto_signin_ready_count !== right.auto_signin_ready_count) {
    return right.auto_signin_ready_count - left.auto_signin_ready_count;
  }
  return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
};

type CreatorSummary = {
  id: number;
  display_name: string;
  handle: string | null;
  notes: string | null;
  status_note: string | null;
  is_active: boolean;
  auto_signin_enabled: boolean;
  profile_url: string | null;
  created_at: Date;
  updated_at: Date;
  authCredentials: {
    provider: string;
    last_error_message: string | null;
    last_checked_at: Date | null;
    connection_state: string;
    is_auto_login: boolean;
  }[];
  auth_healthy_count: number;
  auto_signin_ready_count: number;
  last_connected_at: string | null;
  last_failure_at: string | null;
  last_failure_message: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();
    const provider = searchParams.get("provider")?.trim().toLowerCase();
    const state = searchParams.get("state")?.trim().toLowerCase();
    const auto = searchParams.get("auto");
    const active = searchParams.get("active");
    const sort = normalizeSort(searchParams.get("sort"));

    const where: Record<string, unknown> = {};
    if (active === "true") where.is_active = true;
    if (active === "false") where.is_active = false;
    if (auto === "true") where.auto_signin_enabled = true;
    if (auto === "false") where.auto_signin_enabled = false;

    if (provider || state) {
      where.authCredentials = {
        some: {
          ...(provider && PROVIDERS.includes(provider) ? { provider } : {}),
          ...(state && state.length > 0 ? { connection_state: normalizeConnectionState(state) } : {}),
        },
      };
    }

    const creators = await db.reviewer.findMany({
      where,
      include: {
        authCredentials: {
          orderBy: { provider: "asc" },
        },
      },
      orderBy:
        sort === "name_asc"
          ? { display_name: "asc" }
          : sort === "name_desc"
            ? { display_name: "desc" }
            : sort === "created_asc"
              ? { created_at: "asc" }
              : { updated_at: "desc" },
    });

    const filtered = q
      ? creators.filter((creator) => {
          const text = `${creator.display_name} ${creator.handle || ""} ${creator.notes || ""} ${creator.status_note || ""}`.toLowerCase();
          return text.includes(q.toLowerCase());
        })
      : creators;

    const normalized = filtered.map((creator) => {
      const lastChecked = creator.authCredentials
        .map((auth) => auth.last_checked_at)
        .filter(Boolean)
        .map((date) => new Date(date as Date).getTime())
        .sort((a, b) => b - a);

      const failures = creator.authCredentials
        .map((auth) => ({
          provider: auth.provider,
          message: auth.last_error_message,
          checked_at: auth.last_checked_at ? new Date(auth.last_checked_at).getTime() : null,
        }))
        .filter((failure) => Boolean(failure.message))
        .sort((a, b) => (b.checked_at || 0) - (a.checked_at || 0));

      return {
      ...creator,
      auth_healthy_count: creator.authCredentials.filter((auth) => auth.connection_state === "connected").length,
      auto_signin_ready_count: creator.authCredentials.filter((auth) => auth.is_auto_login && auth.connection_state === "connected").length,
      last_connected_at: lastChecked[0] ? new Date(Math.max(...lastChecked)).toISOString() : null,
      last_failure_at: failures[0]?.checked_at ? new Date(failures[0].checked_at).toISOString() : null,
      last_failure_message: failures[0]?.message || null,
    } as CreatorSummary;
    });

    const sorted = normalized.sort((left, right) => {
      if (sort === "name_asc") return left.display_name.localeCompare(right.display_name);
      if (sort === "name_desc") return right.display_name.localeCompare(left.display_name);
      if (sort === "updated_asc") return new Date(left.updated_at).getTime() - new Date(right.updated_at).getTime();
      if (sort === "updated_desc") return new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime();
      return compareCreatorAutoSignIn(left, right);
    });

    return NextResponse.json({
      items: sorted,
      total: sorted.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const actor = req.headers.get("x-user-id") || req.headers.get("x-admin-user") || "system";

  try {
    const payload = (await req.json()) as unknown;
    const rawItems = normalizePayloadToItems(payload);

    if (rawItems.length === 0) {
      return NextResponse.json({ error: "No valid reviewer items." }, { status: 400 });
    }

    const created = [];
    for (const item of rawItems) {
      const startedAt = Date.now();
      const connections = normalizeConnections(Array.isArray(item.authCredentials)
        ? (item.authCredentials as RawConnection[])
        : []);

      const reviewer = await db.reviewer.create({
        data: {
          display_name: item.display_name!,
          handle: item.handle,
          profile_url: item.profile_url,
          notes: item.notes,
          is_active: item.is_active ?? true,
          auto_signin_enabled: item.auto_signin_enabled ?? true,
          status_note: item.status_note,
        },
      });

      if (connections.length > 0) {
        for (const connection of connections) {
          await db.reviewerAuthCredential.create({
            data: {
              reviewer_id: reviewer.id,
              provider: connection.provider,
              account_label: connection.account_label,
              profile_name: connection.profile_name,
              auth_mode: connection.auth_mode,
              auth_hint: connection.auth_hint,
              connection_state: connection.connection_state,
              is_auto_login: connection.is_auto_login,
              is_primary: connection.is_primary,
            },
          });
        }
      }

      const withCredentials = await db.reviewer.findUnique({
        where: { id: reviewer.id },
        include: { authCredentials: true },
      });

      emitAdminAuditLog({
        action: "CREATOR_CREATE",
        actor,
        targetId: reviewer.id,
        summary: `Created creator ${reviewer.display_name}`,
        meta: {
          display_name: reviewer.display_name,
          handle: reviewer.handle,
          profile_url: reviewer.profile_url,
          connection_count: connections.length,
          is_active: reviewer.is_active,
          auto_signin_enabled: reviewer.auto_signin_enabled,
          elapsed_ms: Date.now() - startedAt,
        },
      });

      created.push(withCredentials);
    }

    return NextResponse.json({ added: created.length, items: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
