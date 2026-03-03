import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitAdminAuditLog } from "@/lib/adminAudit";

const normalizeState = (rawState: unknown): string => {
  const state = String(rawState || "disconnected").trim().toLowerCase();
  return ["connected", "disconnected", "needs_reauth", "error"].includes(state) ? state : "disconnected";
};

type PatchPayload = {
  display_name?: string;
  handle?: string | null;
  profile_url?: string | null;
  notes?: string | null;
  is_active?: boolean;
  auto_signin_enabled?: boolean;
  status_note?: string | null;
  authCredentials?: Array<{
    id?: number;
    provider: string;
    account_label?: string | null;
    profile_name?: string | null;
    auth_mode?: string;
    auth_hint?: string | null;
    connection_state?: string;
    is_auto_login?: boolean;
    is_primary?: boolean;
  }>;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

const readId = async (params: RouteContext["params"]) => {
  const { id } = await params;
  return parseInt(id, 10);
};

const normalizeAuthInputs = (payload: PatchPayload["authCredentials"] | undefined) => {
  if (!Array.isArray(payload)) return [];
  return payload
    .map((item) => ({
      provider: String(item?.provider || "").trim().toLowerCase(),
      account_label: item?.account_label === undefined ? null : String(item.account_label || "").trim() || null,
      profile_name: item?.profile_name === undefined ? null : String(item.profile_name || "").trim() || null,
      auth_mode: item?.auth_mode || "oauth",
      auth_hint: item?.auth_hint === undefined ? null : String(item.auth_hint || "").trim() || null,
      connection_state: normalizeState(item?.connection_state),
      is_auto_login: item?.is_auto_login !== false,
      is_primary: !!item?.is_primary,
    }))
    .filter((item) => item.provider.length > 0);
};

const toBooleanValue = (value: unknown, fallback: boolean) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  }
  if (value === undefined || value === null) return fallback;
  return fallback;
};

const normalizeBooleanPayload = (value: unknown, fallback: boolean | undefined) => {
  if (value === undefined) return fallback;
  return toBooleanValue(value, !!fallback);
};

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const actor = req.headers.get("x-user-id") || req.headers.get("x-admin-user") || "system";
    const id = await readId(params);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    const payload = (await req.json()) as PatchPayload;
    const nextName =
      payload.display_name === undefined ? undefined : String(payload.display_name).trim();
    if (nextName !== undefined && nextName.length === 0) {
      return NextResponse.json({ error: "display_name must not be empty." }, { status: 400 });
    }

    const hasUpdate = ["display_name", "handle", "profile_url", "notes", "is_active", "auto_signin_enabled", "status_note", "authCredentials"].some(
      (key) => Object.prototype.hasOwnProperty.call(payload, key),
    );
    if (!hasUpdate) {
      return NextResponse.json({ error: "No updatable fields." }, { status: 400 });
    }

    const changedFields = Object.keys(payload);
    const startedAt = Date.now();

    const updated = await db.$transaction(async (tx) => {
      if (payload.display_name !== undefined || payload.handle !== undefined || payload.profile_url !== undefined || payload.notes !== undefined || payload.is_active !== undefined || payload.auto_signin_enabled !== undefined || payload.status_note !== undefined) {
        await tx.reviewer.update({
          where: { id },
          data: {
            ...(payload.display_name !== undefined ? { display_name: nextName || "" } : {}),
            ...(payload.handle !== undefined ? { handle: payload.handle?.trim() || null } : {}),
            ...(payload.profile_url !== undefined ? { profile_url: payload.profile_url?.trim() || null } : {}),
            ...(payload.notes !== undefined ? { notes: payload.notes?.trim() || null } : {}),
            ...(payload.is_active !== undefined
              ? { is_active: normalizeBooleanPayload(payload.is_active, true) ?? false }
              : {}),
            ...(payload.auto_signin_enabled !== undefined
              ? { auto_signin_enabled: normalizeBooleanPayload(payload.auto_signin_enabled, true) ?? false }
              : {}),
            ...(payload.status_note !== undefined ? { status_note: payload.status_note?.trim() || null } : {}),
          },
        });
      }

      if (Array.isArray(payload.authCredentials)) {
        const authInputs = normalizeAuthInputs(payload.authCredentials);
        await tx.reviewerAuthCredential.deleteMany({ where: { reviewer_id: id } });

        for (const authInput of authInputs) {
          await tx.reviewerAuthCredential.create({
            data: {
              reviewer_id: id,
              provider: authInput.provider,
              account_label: authInput.account_label,
              profile_name: authInput.profile_name,
              auth_mode: authInput.auth_mode,
              auth_hint: authInput.auth_hint,
              connection_state: authInput.connection_state,
              is_auto_login: normalizeBooleanPayload(authInput.is_auto_login, true) ?? false,
              is_primary: authInput.is_primary,
            },
          });
        }
      }

      return tx.reviewer.findUnique({
        where: { id },
        include: { authCredentials: true },
      });
    });

    if (!updated) {
      return NextResponse.json({ error: "Reviewer not found." }, { status: 404 });
    }

    emitAdminAuditLog({
      action: "CREATOR_UPDATE",
      actor,
      targetId: id,
      summary: `Updated creator ${id}`,
      meta: {
        changed_fields: changedFields.join(","),
        elapsed_ms: Date.now() - startedAt,
        has_credentials_update: Array.isArray(payload.authCredentials),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const actor = req.headers.get("x-user-id") || req.headers.get("x-admin-user") || "system";

  try {
    const startedAt = Date.now();
    const id = await readId(params);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    const target = await db.reviewer.findUnique({
      where: { id },
      select: { display_name: true },
    });
    if (!target) {
      return NextResponse.json({ error: "Reviewer not found." }, { status: 404 });
    }

    await db.reviewer.delete({ where: { id } });

    emitAdminAuditLog({
      action: "CREATOR_DELETE",
      actor,
      targetId: id,
      summary: `Deleted creator ${target.display_name}`,
      meta: {
        display_name: target.display_name,
        elapsed_ms: Date.now() - startedAt,
      },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const id = await readId(params);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid id." }, { status: 400 });
    }

    const reviewer = await db.reviewer.findUnique({
      where: { id },
      include: { authCredentials: true },
    });
    if (!reviewer) return NextResponse.json({ error: "Reviewer not found." }, { status: 404 });
    return NextResponse.json(reviewer);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
