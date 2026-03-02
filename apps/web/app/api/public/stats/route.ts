import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [totalCampaigns, platforms, types] = await Promise.all([
      db.campaign.count(),
      db.campaign.groupBy({ by: ["platform_id"], _count: { platform_id: true } }),
      db.campaign.groupBy({ by: ["campaign_type"], _count: { campaign_type: true } }),
    ]);

    const allPlatforms = await db.platform.findMany({ select: { id: true, name: true } });

    const platformBreakdown = (platforms as Array<{ platform_id: number; _count: { platform_id: number } }>).map((p) => {
      const plat = allPlatforms.find((pl) => pl.id === p.platform_id);
      return {
        name: plat?.name ?? "기타",
        count: p._count.platform_id,
      };
    }).sort((a, b) => b.count - a.count);

    const typeBreakdown = types.map((t) => ({
      campaign_type: t.campaign_type,
      count: t._count.campaign_type,
    }));

    return NextResponse.json({
      totalCampaigns,
      platformBreakdown,
      typeBreakdown,
    });
  } catch {
    return NextResponse.json({
      totalCampaigns: 0,
      platformBreakdown: [],
      typeBreakdown: [],
    });
  }
}