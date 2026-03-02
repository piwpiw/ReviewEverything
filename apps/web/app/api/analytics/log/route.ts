import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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
  } catch (error: any) {
    console.error("Action log error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
