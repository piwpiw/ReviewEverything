import { NextResponse } from "next/server";
import { getTrendingCampaigns } from "@/lib/analytics";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const trending = await getTrendingCampaigns(6);
        const response = NextResponse.json({ data: trending });

        // Cache trending data for 5 minutes, stale for 1 hour
        response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
