import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * PATCH /api/me/schedules/[id]
 * Update a specific schedule.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const scheduleId = parseInt(id, 10);

    if (isNaN(scheduleId)) {
        return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { status, custom_title, visit_date, deadline_date, sponsorship_value, ad_fee, memo, alarm_enabled } = body;

        const hasField = (key: string) => Object.prototype.hasOwnProperty.call(body, key);

        const visitDateValue =
            hasField("visit_date")
                ? (visit_date ? new Date(visit_date) : null)
                : undefined;
        const deadlineDateValue =
            hasField("deadline_date")
                ? (deadline_date ? new Date(deadline_date) : null)
                : undefined;

        const schedule = await db.userSchedule.update({
            where: { id: scheduleId },
            data: {
                status,
                custom_title,
                visit_date: visitDateValue,
                deadline_date: deadlineDateValue,
                sponsorship_value,
                ad_fee,
                memo,
                alarm_enabled,
            },
        });

        return NextResponse.json(schedule);
    } catch (error: unknown) {
        console.error("[API_ME_SCHEDULES_PATCH_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/me/schedules/[id]
 * Delete a specific schedule.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const scheduleId = parseInt(id, 10);

    if (isNaN(scheduleId)) {
        return NextResponse.json({ error: "Invalid schedule ID" }, { status: 400 });
    }

    try {
        await db.userSchedule.delete({
            where: { id: scheduleId },
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("[API_ME_SCHEDULES_DELETE_ERROR]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
