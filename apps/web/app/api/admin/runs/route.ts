import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const platform_id = searchParams.get('platform_id');
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const where = platform_id ? { platform_id: parseInt(platform_id, 10) } : {};
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            db.ingestRun.findMany({
                where,
                orderBy: { start_time: 'desc' },
                skip,
                take: limit,
                include: { platform: true }
            }),
            db.ingestRun.count({ where })
        ]);

        return NextResponse.json({
            data,
            meta: {
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
