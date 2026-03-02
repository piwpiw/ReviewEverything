import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const numId = parseInt(id, 10);

    if (isNaN(numId)) {
        return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    try {
        const campaign = await db.campaign.findUnique({
            where: { id: numId },
            include: {
                platform: true,
                snapshots: {
                    orderBy: { scraped_at: "desc" },
                    take: 7,
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        return NextResponse.json(campaign);
    } catch (error: unknown) {
        console.error("[API_CAMPAIGN_DETAIL_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
