import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/me/schedules
 * List schedules for a specific user.
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    try {
        const schedules = await db.userSchedule.findMany({
            where: { user_id: parseInt(userId, 10) },
            include: { campaign: { include: { platform: true } } },
            orderBy: { deadline_date: "asc" },
        });

        return NextResponse.json(schedules);
    } catch (error: unknown) {
        console.error("[API_ME_SCHEDULES_GET_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/me/schedules
 * Create a new user schedule (applied, selected, visit_planned, review_completed).
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_id, campaign_id, custom_title, status, visit_date, deadline_date, sponsorship_value, ad_fee, memo } = body;

        if (!user_id) {
            return NextResponse.json({ error: "user_id is required" }, { status: 400 });
        }

        const schedule = await db.userSchedule.create({
            data: {
                user_id: parseInt(user_id, 10),
                campaign_id: campaign_id ? parseInt(campaign_id, 10) : null,
                custom_title,
                status: status || "APPLIED",
                visit_date: visit_date ? new Date(visit_date) : null,
                deadline_date: deadline_date ? new Date(deadline_date) : null,
                sponsorship_value: sponsorship_value || 0,
                ad_fee: ad_fee || 0,
                memo,
            },
        });

        return NextResponse.json(schedule);
    } catch (error: unknown) {
        console.error("[API_ME_SCHEDULES_POST_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
