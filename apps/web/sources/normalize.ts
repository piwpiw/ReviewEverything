import { db } from "../lib/db";
import { ScrapedCampaign } from "./types";

export function normalizeCampaignType(typeRaw: string): 'VST' | 'SHP' | 'PRS' {
    const norm = typeRaw.toLowerCase();
    if (norm.includes('방문') || norm.includes('visit')) return 'VST';
    if (norm.includes('배송') || norm.includes('delivery')) return 'SHP';
    return 'PRS'; // Default to reporter/others
}

export function normalizeMediaType(mediaRaw: string): 'BP' | 'IP' | 'YP' | 'OTHER' {
    const norm = mediaRaw.toLowerCase();
    if (norm.includes('blog') || norm.includes('블로그')) return 'BP';
    if (norm.includes('insta') || norm.includes('인스타')) return 'IP';
    if (norm.includes('youtube') || norm.includes('유튜브')) return 'YP';
    return 'OTHER';
}

export async function processAndDedupeCampaign(platformId: number, item: ScrapedCampaign) {
    // 1. Find existing
    const existing = await db.campaign.findUnique({
        where: {
            platform_id_original_id: {
                platform_id: platformId,
                original_id: item.original_id,
            }
        },
        include: { snapshots: { orderBy: { scraped_at: 'desc' }, take: 1 } }
    });

    if (!existing) {
        // Insert new
        const newCampaign = await db.campaign.create({
            data: {
                platform_id: platformId,
                original_id: item.original_id,
                title: item.title,
                campaign_type: item.campaign_type,
                media_type: item.media_type,
                location: item.location,
                reward_text: item.reward_text,
                thumbnail_url: item.thumbnail_url,
                url: item.url,
                apply_end_date: item.apply_end_date,
                snapshots: {
                    create: {
                        recruit_count: item.recruit_count,
                        applicant_count: item.applicant_count,
                        competition_rate: item.recruit_count > 0 ? item.applicant_count / item.recruit_count : 0,
                    }
                }
            }
        });
        return { status: 'created', id: newCampaign.id };
    } else {
        // Update existing core details safely
        await db.campaign.update({
            where: { id: existing.id },
            data: {
                title: item.title,
                apply_end_date: item.apply_end_date,
                updated_at: new Date()
            }
        });

        // Determine if snapshot needs updating
        const lastSnapshot = existing.snapshots[0];
        if (!lastSnapshot || lastSnapshot.recruit_count !== item.recruit_count || lastSnapshot.applicant_count !== item.applicant_count) {
            await db.campaignSnapshot.create({
                data: {
                    campaign_id: existing.id,
                    recruit_count: item.recruit_count,
                    applicant_count: item.applicant_count,
                    competition_rate: item.recruit_count > 0 ? item.applicant_count / item.recruit_count : 0,
                }
            });
            return { status: 'updated_with_snapshot', id: existing.id };
        }
        return { status: 'updated', id: existing.id };
    }
}
