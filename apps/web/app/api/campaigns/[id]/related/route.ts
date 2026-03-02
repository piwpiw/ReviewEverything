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
            select: { platform_id: true, category: true, region_depth1: true },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // Try to find related campaigns by criteria
        // 1. Same category if exists
        // 2. Same region if category empty
        // 3. Same platform as fallback
        const related = await db.campaign.findMany({
            where: {
                id: { not: numId },
                OR: [
                    { category: campaign.category },
                    { region_depth1: campaign.region_depth1 },
                    { platform_id: campaign.platform_id }
                ]
            },
            take: 4,
            orderBy: { created_at: "desc" },
            include: {
                platform: true,
                snapshots: {
                    orderBy: { scraped_at: "desc" },
                    take: 1,
                },
            },
        });

        return NextResponse.json(related);
    } catch (error: unknown) {
        console.error("[API_CAMPAIGN_RELATED_ERROR]", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
