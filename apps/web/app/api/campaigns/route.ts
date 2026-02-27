import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildCampaignsQuery } from "@/lib/queryBuilder";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const qb = buildCampaignsQuery(searchParams);

        const [data, total] = await Promise.all([
            db.campaign.findMany({
                where: qb.where,
                orderBy: qb.orderBy as any,
                skip: qb.skip,
                take: qb.take,
                include: {
                    platform: true,
                    snapshots: {
                        orderBy: { scraped_at: 'desc' },
                        take: 1
                    }
                }
            }),
            db.campaign.count({ where: qb.where })
        ]);

        return NextResponse.json({
            data,
            meta: {
                total,
                page: qb.page,
                totalPages: Math.ceil(total / qb.limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
