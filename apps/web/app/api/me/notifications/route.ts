import { NextRequest, NextResponse } from "next/server";
import { dispatchNotificationWithRetry, normalizeDeliveryChannel } from "@/lib/notificationSender";
import { db } from "@/lib/db";
import { getMissingEnvVars, REQUIRED_DB_ENV } from "@/lib/runtimeEnv";

/**
 * GET /api/me/notifications
 * Fetch recent notification history for a user.
 */

const isDbReady = () => getMissingEnvVars(REQUIRED_DB_ENV).length === 0;
const buildMockListResponse = (take = 50) => ({
    data: [],
    meta: {
        count: 0,
        hasMore: false,
        nextCursor: null,
        source: "mock",
        take,
    },
});

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const statusFilter = searchParams.get("status")?.trim().toLowerCase() ?? null;
    const channelFilter = searchParams.get("channel")?.trim().toLowerCase() ?? null;
    const fromFilter = searchParams.get("from");
    const toFilter = searchParams.get("to");
    const daysFilter = searchParams.get("days");
    const takeFilter = searchParams.get("take");
    const cursorFilter = searchParams.get("cursor");

    if (!userId) {
        return NextResponse.json({ error: "userId is required", code: "USER_ID_REQUIRED" }, { status: 400 });
    }
    const parsedUserId = Number.parseInt(userId, 10);
    if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
        return NextResponse.json({ error: "invalid userId", code: "INVALID_USER_ID" }, { status: 400 });
    }
    const parsedTake = Math.min(100, Math.max(10, Number.parseInt(takeFilter || "50", 10)));
    if (!Number.isInteger(parsedTake) || parsedTake <= 0) {
        return NextResponse.json({ error: "invalid take", code: "INVALID_TAKE" }, { status: 400 });
    }

    let cursorId: number | undefined = undefined;
    if (cursorFilter) {
        const parsedCursorId = Number.parseInt(cursorFilter, 10);
        if (!Number.isInteger(parsedCursorId) || parsedCursorId <= 0) {
            return NextResponse.json(
                { error: "invalid cursor", code: "INVALID_CURSOR" },
                { status: 400 },
            );
        }
        cursorId = parsedCursorId;
    }
    if (cursorFilter && cursorId === undefined) {
        return NextResponse.json({ error: "invalid cursor", code: "INVALID_CURSOR" }, { status: 400 });
    }

    if (!isDbReady()) {
        return NextResponse.json(buildMockListResponse(parsedTake), { status: 200 });
    }

    const where: {
        user_id: number;
        status?: { in: string[] } | { notIn: string[] } | string;
        channel?: string;
        created_at?: { gte?: Date; lte?: Date };
    } = { user_id: parsedUserId };

    if (statusFilter && !["all", "success", "pending", "failed"].includes(statusFilter)) {
        return NextResponse.json({ error: "invalid status filter", code: "INVALID_STATUS_FILTER" }, { status: 400 });
    }

    if (statusFilter === "success") {
        where.status = { in: ["SENT", "SUCCESS"] };
    } else if (statusFilter === "failed") {
        where.status = { notIn: ["SENT", "SUCCESS", "PENDING"] };
    } else if (statusFilter === "pending") {
        where.status = "PENDING";
    }

    if (!channelFilter || channelFilter === "all") {
        // no-op: return all channels
    } else if (["push", "kakao", "telegram"].includes(channelFilter)) {
        where.channel = channelFilter;
    } else if (channelFilter) {
        return NextResponse.json({ error: "invalid channel filter", code: "INVALID_CHANNEL_FILTER" }, { status: 400 });
    }

    const createdAtFilter: { gte?: Date; lte?: Date } = {};

    if (fromFilter) {
        const fromDate = new Date(fromFilter);
        if (Number.isNaN(fromDate.getTime())) {
            return NextResponse.json({ error: "invalid from date", code: "INVALID_FROM_DATE" }, { status: 400 });
        }
        createdAtFilter.gte = fromDate;
    }

    if (toFilter) {
        const toDate = new Date(toFilter);
        if (Number.isNaN(toDate.getTime())) {
            return NextResponse.json({ error: "invalid to date", code: "INVALID_TO_DATE" }, { status: 400 });
        }
        createdAtFilter.lte = toDate;
    }

    if (daysFilter) {
        const dayCount = Number.parseInt(daysFilter, 10);
        if (!Number.isInteger(dayCount) || dayCount < 1) {
            return NextResponse.json({ error: "invalid days", code: "INVALID_DAYS" }, { status: 400 });
        }
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - dayCount);
        createdAtFilter.gte = createdAtFilter.gte ? new Date(Math.max(createdAtFilter.gte.getTime(), fromDate.getTime())) : fromDate;
    }

    if (createdAtFilter.gte || createdAtFilter.lte) {
        where.created_at = createdAtFilter;
    }

    try {
        const notifications = await db.notificationDelivery.findMany({
            where,
            include: {
                userSchedule: {
                    include: { campaign: true }
                }
            },
            orderBy: { id: "desc" },
            take: parsedTake,
            cursor: cursorId ? { id: cursorId } : undefined,
            skip: cursorId ? 1 : 0,
        });

        const nextCursor = notifications.length > 0 ? notifications[notifications.length - 1].id : null;
        return NextResponse.json({
            data: notifications,
            meta: {
                count: notifications.length,
                hasMore: notifications.length === parsedTake,
                nextCursor,
            },
        });
    } catch (error: unknown) {
        console.error("[API_ME_NOTIFICATIONS_GET_ERROR]", error);
        return NextResponse.json(
          { error: "Internal server error", code: "INTERNAL_ERROR" },
          { status: 500 },
        );
    }
}

/**
 * POST /api/me/notifications
 * POST /api/me/notifications/test (legacy alias)
 * Trigger a test notification for a user.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, scheduleId, message, channel, dryRun = false } = body;

        if (!userId) {
            return NextResponse.json({ error: "userId is required" }, { status: 400 });
        }

        const parsedChannel = normalizeDeliveryChannel(channel);
        if (channel !== undefined && parsedChannel === null) {
            return NextResponse.json({ error: "invalid channel", code: "INVALID_CHANNEL" }, { status: 400 });
        }

        const safeChannel = parsedChannel || "push";
        const parsedUserId = Number.parseInt(userId, 10);
        if (Number.isNaN(parsedUserId)) {
            return NextResponse.json({ error: "invalid userId", code: "INVALID_USER_ID" }, { status: 400 });
        }

        const shouldPersist = !Boolean(dryRun);
        let parsedScheduleId =
            typeof scheduleId === "undefined" || scheduleId === null
                ? null
                : Number.parseInt(String(scheduleId), 10);

        if (shouldPersist && Number.isNaN(parsedScheduleId)) {
            return NextResponse.json(
              { error: "scheduleId is required unless dryRun is true", code: "SCHEDULE_ID_REQUIRED" },
              { status: 400 },
            );
        }

        if (!shouldPersist && Number.isNaN(parsedScheduleId)) {
            // fallback to null for compatibility
            parsedScheduleId = null;
        }

        const payload = {
            userId: parsedUserId,
            scheduleId: parsedScheduleId,
            message: message || "This is a test notification.",
        };

        const dispatchResult = await dispatchNotificationWithRetry(safeChannel, payload);

        let deliveryId: number | undefined;
        if (shouldPersist && payload.scheduleId !== null) {
            if (!isDbReady()) {
                return NextResponse.json(
                    { error: "Database is unavailable. Retry when DB is available.", code: "DB_UNAVAILABLE" },
                    { status: 503 },
                );
            }
            const now = new Date();
            const delivery = await db.notificationDelivery.create({
                data: {
                    user_id: parsedUserId,
                    user_schedule_id: payload.scheduleId,
                    channel: dispatchResult.finalChannel,
                    status: dispatchResult.ok ? "SENT" : "FAILED",
                    sent_at: dispatchResult.ok ? now : null,
                    error_message: dispatchResult.ok ? null : dispatchResult.detail,
                    message: message || "This is a test notification.",
                    due_days: 0,
                    attempted_channels: JSON.stringify(dispatchResult.attemptedChannels),
                },
            });
            deliveryId = delivery.id;
        }

        if (!dispatchResult.ok) {
            return NextResponse.json(
                {
                    success: false,
                    persisted: Boolean(shouldPersist),
                    deliveryId,
                    channel: dispatchResult.finalChannel,
                    detail: dispatchResult.detail,
                    attemptedChannels: dispatchResult.attemptedChannels,
                },
                { status: 400 },
            );
        }

        return NextResponse.json({
            success: true,
            persisted: Boolean(shouldPersist),
            deliveryId,
            channel: dispatchResult.finalChannel,
            detail: dispatchResult.detail || null,
            attemptedChannels: dispatchResult.attemptedChannels,
        });
    } catch (error: unknown) {
        console.error("[API_ME_NOTIFICATIONS_POST_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * PATCH /api/me/notifications
 * Update notification delivery record details.
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const rawUserId = (body as Record<string, unknown>).userId;
        const rawDeliveryId = (body as Record<string, unknown>).deliveryId ?? (body as Record<string, unknown>).id ?? (body as Record<string, unknown>).notificationId;

        if (!rawUserId) {
            return NextResponse.json({ error: "userId is required", code: "USER_ID_REQUIRED" }, { status: 400 });
        }
        if (!rawDeliveryId) {
            return NextResponse.json({ error: "deliveryId is required", code: "DELIVERY_ID_REQUIRED" }, { status: 400 });
        }

        const userId = Number.parseInt(String(rawUserId), 10);
        const deliveryId = Number.parseInt(String(rawDeliveryId), 10);
        if (!Number.isInteger(userId) || userId <= 0) {
            return NextResponse.json({ error: "invalid userId", code: "INVALID_USER_ID" }, { status: 400 });
        }
        if (!Number.isInteger(deliveryId) || deliveryId <= 0) {
            return NextResponse.json({ error: "invalid deliveryId", code: "INVALID_DELIVERY_ID" }, { status: 400 });
        }

        if (!isDbReady()) {
            return NextResponse.json(
              { error: "Database is unavailable. Retry when DB is available.", code: "DB_UNAVAILABLE" },
              { status: 503 },
            );
        }

        const updates: Record<string, unknown> = {};
        const currentStatus = (body as Record<string, unknown>).status;
        const allowedStatus = ["PENDING", "SENT", "FAILED", "SUCCESS"];
        if (currentStatus !== undefined) {
            if (typeof currentStatus !== "string") {
                return NextResponse.json({ error: "status must be a string", code: "INVALID_STATUS" }, { status: 400 });
            }
            const normalizedStatus = currentStatus.trim().toUpperCase();
            if (!allowedStatus.includes(normalizedStatus)) {
                return NextResponse.json(
                    { error: "invalid status", code: "INVALID_STATUS" },
                    { status: 400 },
                );
            }
            updates.status = normalizedStatus;
        }

        const messageRaw = (body as Record<string, unknown>).message;
        if (messageRaw !== undefined) {
            if (messageRaw !== null && typeof messageRaw !== "string") {
                return NextResponse.json({ error: "message must be a string", code: "INVALID_MESSAGE" }, { status: 400 });
            }
            updates.message = messageRaw === null ? null : messageRaw.trim();
        }

        const errorMessageRaw =
            (body as Record<string, unknown>).errorMessage !== undefined
                ? (body as Record<string, unknown>).errorMessage
                : (body as Record<string, unknown>).error_message;
        if (errorMessageRaw !== undefined) {
            if (errorMessageRaw !== null && typeof errorMessageRaw !== "string") {
                return NextResponse.json(
                    { error: "errorMessage must be a string", code: "INVALID_ERROR_MESSAGE" },
                    { status: 400 },
                );
            }
            updates.error_message = errorMessageRaw === null ? null : errorMessageRaw.trim();
        }

        const channelRaw = (body as Record<string, unknown>).channel;
        if (channelRaw !== undefined) {
            const normalizedChannel = normalizeDeliveryChannel(channelRaw);
            if (normalizedChannel === null) {
                return NextResponse.json(
                    { error: "invalid channel", code: "INVALID_CHANNEL" },
                    { status: 400 },
                );
            }
            updates.channel = normalizedChannel;
        }

        const dueDaysRaw = (body as Record<string, unknown>).dueDays;
        if (dueDaysRaw !== undefined) {
            const dueDays = Number.parseInt(String(dueDaysRaw), 10);
            if (!Number.isInteger(dueDays) || dueDays < 0) {
                return NextResponse.json({ error: "invalid dueDays", code: "INVALID_DUE_DAYS" }, { status: 400 });
            }
            updates.due_days = dueDays;
        }

        const sentAtRaw = (body as Record<string, unknown>).sentAt;
        if (sentAtRaw !== undefined) {
            if (sentAtRaw === null) {
                updates.sent_at = null;
            } else if (typeof sentAtRaw === "string" || typeof sentAtRaw === "number") {
                const sentAt = new Date(sentAtRaw);
                if (Number.isNaN(sentAt.getTime())) {
                    return NextResponse.json(
                        { error: "invalid sentAt", code: "INVALID_SENT_AT" },
                        { status: 400 },
                    );
                }
                updates.sent_at = sentAt;
            } else {
                return NextResponse.json(
                    { error: "sentAt must be a valid date or null", code: "INVALID_SENT_AT" },
                    { status: 400 },
                );
            }
        }

        const attemptedChannelsRaw = (body as Record<string, unknown>).attemptedChannels;
        if (attemptedChannelsRaw !== undefined) {
            if (attemptedChannelsRaw === null) {
                updates.attempted_channels = null;
            } else if (typeof attemptedChannelsRaw === "string") {
                updates.attempted_channels = attemptedChannelsRaw;
            } else if (Array.isArray(attemptedChannelsRaw)) {
                updates.attempted_channels = JSON.stringify(attemptedChannelsRaw);
            } else {
                return NextResponse.json(
                    { error: "attemptedChannels must be JSON string or array", code: "INVALID_ATTEMPTED_CHANNELS" },
                    { status: 400 },
                );
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { error: "no update fields", code: "NO_UPDATE_FIELDS" },
                { status: 400 },
            );
        }

        const existing = await db.notificationDelivery.findUnique({
            where: { id: deliveryId },
            select: { id: true, user_id: true },
        });
        if (!existing) {
            return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
        }
        if (existing.user_id !== userId) {
            return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
        }

        const delivery = await db.notificationDelivery.update({
            where: { id: deliveryId },
            data: {
                ...updates,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ success: true, data: delivery });
    } catch (error: unknown) {
        console.error("[API_ME_NOTIFICATIONS_PATCH_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error", code: "INTERNAL_ERROR" },
            { status: 500 },
        );
    }
}
