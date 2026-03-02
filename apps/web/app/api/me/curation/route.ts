import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ddayLabel = (endDate: Date | null) => {
  if (!endDate) return { label: "No deadline", level: "info" as const };
  const diffDays = Math.ceil((endDate.getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return { label: "Ended", level: "critical" as const };
  if (diffDays === 0) return { label: "D-0", level: "critical" as const };
  if (diffDays <= 3) return { label: `D-${diffDays}`, level: "warn" as const };
  return { label: `D-${diffDays}`, level: "info" as const };
};

/**
 * GET /api/me/curation
 * Lightweight recommendation payload used by /me dashboard.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limitRaw = searchParams.get("limit") || "6";
  const limit = clamp(Number.parseInt(limitRaw, 10) || 6, 1, 12);

  try {
    const campaigns = await db.campaign.findMany({
      where: {
        apply_end_date: { not: null, gt: new Date() },
      },
      orderBy: [{ apply_end_date: "asc" }, { competition_rate: "asc" }, { reward_value: "desc" }],
      take: limit,
      include: { platform: true },
    });

    const picks = campaigns.map((c) => {
      const rewardValue = Number(c.reward_value || 0);
      const comp = Number(c.competition_rate || 0);
      const deadline = ddayLabel(c.apply_end_date);

      const matchScore = clamp(Math.round(92 - comp * 6 + Math.min(8, rewardValue / 200_000)), 30, 99);
      const roi = `${clamp((rewardValue / 100_000) / Math.max(0.6, comp + 0.5), 1, 25).toFixed(1)}x`;
      const efficiency = `${clamp(Math.round(rewardValue / 80), 100, 99000).toLocaleString()}/h`;

      const reason = [
        c.category ? `Category: ${c.category}` : null,
        rewardValue ? `Reward: ${rewardValue.toLocaleString()}` : null,
        comp ? `Competition: ${comp.toFixed(2)}` : null,
        deadline.label ? `Deadline: ${deadline.label}` : null,
      ]
        .filter(Boolean)
        .join(" • ");

      return {
        id: c.id,
        title: c.title,
        category: c.category || "Other",
        roi,
        efficiency,
        deadline: deadline.label,
        match_score: matchScore,
        reason,
        thumbnail_url: c.thumbnail_url,
        platform: { id: c.platform_id, name: c.platform?.name || "Unknown" },
        apply_end_date: c.apply_end_date,
        reward_text: c.reward_text,
        reward_value: rewardValue,
        competition_rate: comp,
      };
    });

    return NextResponse.json({ picks });
  } catch (error: unknown) {
    console.error("[API_ME_CURATION_GET_ERROR]", error);
    return NextResponse.json({ picks: [] });
  }
}

