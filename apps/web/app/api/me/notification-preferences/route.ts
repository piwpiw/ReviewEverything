import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMissingEnvVars, REQUIRED_DB_ENV } from "@/lib/runtimeEnv";

type PreferencePayload = {
  userId: number;
  notify_kakao_enabled?: boolean;
  notify_telegram_enabled?: boolean;
  notify_push_enabled?: boolean;
};

const isDbReady = () => getMissingEnvVars(REQUIRED_DB_ENV).length === 0;
const DEFAULT_PREFERENCES = {
  notify_kakao_enabled: false,
  notify_telegram_enabled: false,
  notify_push_enabled: false,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userIdRaw = searchParams.get("userId");
  if (!userIdRaw) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const userId = Number.parseInt(userIdRaw, 10);
  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "invalid userId" }, { status: 400 });
  }

  if (!isDbReady()) {
    return NextResponse.json({
      ...DEFAULT_PREFERENCES,
      userId,
      source: "mock",
    });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      notify_kakao_enabled: true,
      notify_telegram_enabled: true,
      notify_push_enabled: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as PreferencePayload;

    const userId = Number.parseInt(String(body?.userId), 10);
    if (!Number.isInteger(userId)) {
      return NextResponse.json({ error: "valid userId is required" }, { status: 400 });
    }

    const payload: PreferencePayload = {
      userId,
      notify_kakao_enabled:
        typeof body?.notify_kakao_enabled === "boolean" ? body.notify_kakao_enabled : undefined,
      notify_telegram_enabled:
        typeof body?.notify_telegram_enabled === "boolean" ? body.notify_telegram_enabled : undefined,
      notify_push_enabled:
        typeof body?.notify_push_enabled === "boolean" ? body.notify_push_enabled : undefined,
    };

    if (!isDbReady()) {
      return NextResponse.json({
        success: true,
        source: "mock",
        preferences: {
          notify_kakao_enabled: payload.notify_kakao_enabled ?? DEFAULT_PREFERENCES.notify_kakao_enabled,
          notify_telegram_enabled: payload.notify_telegram_enabled ?? DEFAULT_PREFERENCES.notify_telegram_enabled,
          notify_push_enabled: payload.notify_push_enabled ?? DEFAULT_PREFERENCES.notify_push_enabled,
        },
      });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        notify_kakao_enabled: true,
        notify_telegram_enabled: true,
        notify_push_enabled: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        notify_kakao_enabled: payload.notify_kakao_enabled ?? user.notify_kakao_enabled,
        notify_telegram_enabled: payload.notify_telegram_enabled ?? user.notify_telegram_enabled,
        notify_push_enabled: payload.notify_push_enabled ?? user.notify_push_enabled,
      },
      select: {
        notify_kakao_enabled: true,
        notify_telegram_enabled: true,
        notify_push_enabled: true,
      },
    });

    return NextResponse.json({ success: true, preferences: updated });
  } catch (error: unknown) {
    console.error("[API_ME_NOTIFICATION_PREFERENCES_PUT_ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
