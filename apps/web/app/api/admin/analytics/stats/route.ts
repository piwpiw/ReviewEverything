import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type GroupedStat = {
  date: string;
  totalCampaigns: number;
  totalRecruits: number;
  totalApplicants: number;
  avgCompRate: number;
};

export async function GET() {
  try {
    const stats = await db.platformStats.findMany({
      take: 200,
      orderBy: {
        date: "desc",
      },
      include: {
        platform: {
          select: {
            name: true,
          },
        },
      },
    });

    const groupedStats = stats.reduce<Record<string, GroupedStat[]>>((acc, curr) => {
      const platformName = curr.platform?.name || "Unknown";
      if (!acc[platformName]) {
        acc[platformName] = [];
      }

      acc[platformName].push({
        date: curr.date.toISOString().split("T")[0],
        totalCampaigns: curr.total_campaigns,
        totalRecruits: curr.total_recruits,
        totalApplicants: curr.total_applicants,
        avgCompRate: Number(curr.avg_competition),
      });

      return acc;
    }, {});

    return NextResponse.json({ data: groupedStats });
  } catch (error) {
    console.error("Analytics Stats API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
