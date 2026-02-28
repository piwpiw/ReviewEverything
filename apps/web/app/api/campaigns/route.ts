import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildCampaignsQuery } from "@/lib/queryBuilder";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const qb = buildCampaignsQuery(searchParams);

        const toCompetitionRate = (campaign: any) => {
            const latest = campaign.snapshots?.[0];
            if (!latest) return Number.POSITIVE_INFINITY;

            const parsed = Number(latest.competition_rate);
            if (Number.isFinite(parsed)) return parsed;
            if (!latest.recruit_count || latest.recruit_count <= 0) return Number.POSITIVE_INFINITY;
            return latest.applicant_count / latest.recruit_count;
        };

        let data: any[] = [];
        let total = 0;

        if (qb.sort === 'competition_asc') {
            const all = await db.campaign.findMany({
                where: qb.where,
                orderBy: { created_at: 'desc' },
                include: {
                    platform: true,
                    snapshots: {
                        orderBy: { scraped_at: 'desc' },
                        take: 1
                    }
                }
            });

            const sorted = all.sort((a, b) => toCompetitionRate(a) - toCompetitionRate(b));
            total = sorted.length;
            data = sorted.slice(qb.skip, qb.skip + qb.limit);
        } else {
            [data, total] = await Promise.all([
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
        }

        const response = NextResponse.json({
            data,
            meta: {
                total,
                page: qb.page,
                totalPages: Math.ceil(total / qb.limit)
            }
        });

        // Vercel Edge Cache: Cache for 1 min, serving stale data for up to 10 mins while revalidating
        response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=600');

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
