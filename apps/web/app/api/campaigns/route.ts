import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildCampaignsQuery } from "@/lib/queryBuilder";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const qb = buildCampaignsQuery(searchParams);

        // Phase 2: High-Performance Data retrieval using denormalized columns
        const [campaigns, total] = await Promise.all([
            db.campaign.findMany({
                where: qb.where,
                orderBy: qb.orderBy as any,
                skip: qb.skip,
                take: qb.take,
                include: {
                    platform: true,
                    // Snapshots not strictly needed for list if denormalized stats are used, 
                    // but keeping for history charts if needed in future components
                }
            }),
            db.campaign.count({ where: qb.where })
        ]);

        const response = NextResponse.json({
            campaigns,
            total,
            meta: {
                page: qb.page,
                limit: qb.limit,
                totalPages: Math.ceil(total / qb.limit)
            }
        });

        // Professional Edge Caching (stale-while-revalidate)
        response.headers.set('Cache-Control', 's-maxage=30, stale-while-revalidate=300');

        return response;
    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
