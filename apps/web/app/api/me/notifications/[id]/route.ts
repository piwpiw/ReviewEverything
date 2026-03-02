import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * DELETE /api/me/notifications/[id]?userId=1
 * Delete a notification delivery record for a user.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const notificationId = Number.parseInt(id, 10);

  const { searchParams } = new URL(req.url);
  const userIdRaw = searchParams.get("userId");
  if (!userIdRaw) {
    return NextResponse.json({ error: "userId is required", code: "USER_ID_REQUIRED" }, { status: 400 });
  }
  const userId = Number.parseInt(userIdRaw, 10);

  if (!Number.isInteger(notificationId)) {
    return NextResponse.json(
      { error: "Invalid notification id", code: "INVALID_NOTIFICATION_ID" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: "Invalid userId", code: "INVALID_USER_ID" }, { status: 400 });
  }

  try {
    const existing = await db.notificationDelivery.findUnique({
      where: { id: notificationId },
      select: { id: true, user_id: true },
    });

    if (!existing) return NextResponse.json({ error: "Not found", code: "NOT_FOUND" }, { status: 404 });
    if (existing.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    await db.notificationDelivery.delete({ where: { id: notificationId } });
    return NextResponse.json({ success: true, deliveryId: notificationId });
  } catch (error: unknown) {
    console.error("[API_ME_NOTIFICATIONS_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
