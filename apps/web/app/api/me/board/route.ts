import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

type ScheduleRow = Prisma.UserScheduleGetPayload<{
  include: { campaign: { include: { platform: true } } };
}>;

type BoardNotification = { id: number; message: string | null; status: string };

const buildMock = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");

  return {
    summary: {
      totalSponsorshipValue: 4250000,
      totalAdFee: 1250000,
      totalCampaigns: 18,
    },
    month: `${y}-${m}`,
    monthly: [
      { month: 1, sponsorship: 1000000, ad_fee: 300000, total: 1300000, count: 5 },
      { month: 2, sponsorship: 1500000, ad_fee: 500000, total: 2000000, count: 8 },
      { month: 3, sponsorship: 1750000, ad_fee: 450000, total: 2200000, count: 5 },
      { month: 4, sponsorship: 0, ad_fee: 0, total: 0, count: 0 },
      { month: 5, sponsorship: 0, ad_fee: 0, total: 0, count: 0 },
      { month: 6, sponsorship: 0, ad_fee: 0, total: 0, count: 0 },
    ],
    schedules: [],
    notifications: [],
  };
};

export async function GET(req: NextRequest) {
  const headerUserId = req.headers.get("x-user-id");
  const { searchParams } = new URL(req.url);
  const queryUserId = searchParams.get("userId");

  const userIdRaw = queryUserId || headerUserId || "1";
  const userId = Number.parseInt(userIdRaw, 10);

  if (!Number.isInteger(userId)) {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  const mock = buildMock();

  try {
    const schedules = (await db.userSchedule.findMany({
      where: { user_id: userId },
      include: { campaign: { include: { platform: true } } },
      orderBy: [{ deadline_date: "asc" }, { created_at: "desc" }],
      take: 30,
    })) as ScheduleRow[];

    const totalSponsorshipValue = schedules.reduce((sum, item) => sum + (item.sponsorship_value || 0), 0);
    const totalAdFee = schedules.reduce((sum, item) => sum + (item.ad_fee || 0), 0);
    const totalCampaigns = schedules.filter((s) => Boolean(s.campaign_id)).length;

    const monthlyMap = new Map<number, { sponsorship: number; ad_fee: number; total: number; count: number }>();
    schedules.forEach((schedule) => {
      const pivot = schedule.deadline_date || schedule.visit_date || schedule.created_at;
      const dt = new Date(pivot);
      const monthKey = dt.getMonth() + 1;
      const prev = monthlyMap.get(monthKey) || { sponsorship: 0, ad_fee: 0, total: 0, count: 0 };
      const sponsorship = prev.sponsorship + (schedule.sponsorship_value || 0);
      const ad_fee = prev.ad_fee + (schedule.ad_fee || 0);
      monthlyMap.set(monthKey, { sponsorship, ad_fee, total: sponsorship + ad_fee, count: prev.count + 1 });
    });

    const monthly = Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
      const mdata = monthlyMap.get(month) || { sponsorship: 0, ad_fee: 0, total: 0, count: 0 };
      return { month, ...mdata };
    });

    const notifications = (await db.notificationDelivery.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 10,
      select: { id: true, message: true, status: true },
    })) as BoardNotification[];

    return NextResponse.json({
      summary: { totalSponsorshipValue, totalAdFee, totalCampaigns },
      month: mock.month,
      monthly,
      schedules: schedules.map((s) => ({
        id: s.id,
        custom_title: s.custom_title,
        visit_date: s.visit_date,
        deadline_date: s.deadline_date,
        status: s.status,
        campaign: s.campaign
          ? {
              title: s.campaign.title,
              platform: s.campaign.platform ? { name: s.campaign.platform.name } : null,
            }
          : null,
      })),
      notifications,
    });
  } catch (error: unknown) {
    console.error("[API_ME_BOARD_GET_ERROR]", error);
    return NextResponse.json(mock);
  }
}
