import { db } from "./db";

export interface AnalyticsTrend {
    campaign_id: number;
    trend_score: number; // Percentage increase in applicants vs historical average
    is_hot: boolean;
}

/**
 * Identifies high-growth campaigns based on snapshot history.
 * A campaign is "Trending" if its latest recruitment/applicant ratio 
 * shows significantly higher interest than the platform average.
 */
export async function getTrendingCampaigns(limit = 5) {
    // In a real production environment, this would involve complex SQL window functions.
    // For this MVP, we analyze the latest snapshots for high applicant counts.
    const campaigns = await db.campaign.findMany({
        take: limit * 2,
        include: {
            platform: true,
            snapshots: {
                orderBy: { scraped_at: 'desc' },
                take: 2
            }
        },
        orderBy: {
            snapshots: {
                _count: 'desc'
            }
        }
    });

    return campaigns
        .map(c => {
            const latest = c.snapshots[0];
            const previous = c.snapshots[1];

            let trend_score = 0;
            if (latest && previous && previous.applicant_count > 0) {
                trend_score = ((latest.applicant_count - previous.applicant_count) / previous.applicant_count) * 100;
            } else if (latest) {
                trend_score = (latest.applicant_count / (latest.recruit_count || 1)) * 10;
            }

            return {
                ...c,
                trend_score: Math.round(trend_score),
                is_hot: trend_score > 50
            };
        })
        .sort((a, b) => b.trend_score - a.trend_score)
        .slice(0, limit);
}
