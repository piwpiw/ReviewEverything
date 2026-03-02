import { db } from "../lib/db";

async function summarizeToday() {
  console.log("📊 Starting daily business aggregation...");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const platforms = await db.platform.findMany({ where: { is_active: true } });

  for (const platform of platforms) {
    try {
      const stats = await db.campaign.aggregate({
        where: {
          platform_id: platform.id,
        },
        _count: {
          id: true,
        },
        _sum: {
          recruit_count: true,
          applicant_count: true,
        },
        _avg: {
          competition_rate: true,
        },
      });

      await db.platformStats.upsert({
        where: {
          platform_id_date: {
            platform_id: platform.id,
            date: today,
          },
        },
        update: {
          total_campaigns: stats._count.id,
          total_recruits: stats._sum.recruit_count || 0,
          total_applicants: stats._sum.applicant_count || 0,
          avg_competition: stats._avg.competition_rate || 0,
        },
        create: {
          platform_id: platform.id,
          date: today,
          total_campaigns: stats._count.id,
          total_recruits: stats._sum.recruit_count || 0,
          total_applicants: stats._sum.applicant_count || 0,
          avg_competition: stats._avg.competition_rate || 0,
        },
      });

      console.log(`✅ Aggregated stats for ${platform.name}: ${stats._count.id} campaigns found.`);
    } catch (error) {
      console.error(`❌ Failed to aggregate stats for ${platform.name}:`, error);
    }
  }

  console.log("✨ Daily aggregation complete.");
}

summarizeToday()
  .catch(console.error)
  .finally(() => db.$disconnect());
