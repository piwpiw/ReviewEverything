import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(req: Request) {
  try {
    const { campaignId, action, userId, platform } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const log = await db.userActionLog.create({
      data: {
        campaign_id: campaignId ? parseInt(campaignId) : null,
        user_id: userId ? parseInt(userId) : null,
        action: action.toUpperCase(),
        platform: platform || "WEB",
      },
    });

    return NextResponse.json({ success: true, id: log.id.toString() });
  } catch (error: unknown) {
    console.error("Action log error:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
