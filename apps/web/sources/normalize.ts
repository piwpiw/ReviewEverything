import { db } from "../lib/db";
import { ScrapedCampaign } from "./types";

export function normalizeCampaignType(typeRaw: string): 'VST' | 'SHP' | 'PRS' {
    const norm = typeRaw.toLowerCase();
    if (norm.includes('방문') || norm.includes('visit') || norm.includes('지역')) return 'VST';
    if (norm.includes('배송') || norm.includes('delivery') || norm.includes('제품')) return 'SHP';
    if (norm.includes('기자단') || norm.includes('reporter')) return 'PRS';
    return 'PRS';
}

export function normalizeMediaType(mediaRaw: string): 'BP' | 'IP' | 'YP' | 'OTHER' {
    const norm = mediaRaw.toLowerCase();
    if (norm.includes('blog') || norm.includes('블로그')) return 'BP';
    if (norm.includes('insta') || norm.includes('인스타')) return 'IP';
    if (norm.includes('youtube') || norm.includes('유튜브')) return 'YP';
    return 'OTHER';
}

export async function processAndDedupeCampaign(platformId: number, item: ScrapedCampaign) {
    // Standardize types before storing
    const cType = normalizeCampaignType(item.campaign_type);
    const mType = normalizeMediaType(item.media_type);

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
                campaign_type: cType,
                media_type: mType,
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
                campaign_type: cType,
                media_type: mType,
                location: item.location,
                reward_text: item.reward_text,
                thumbnail_url: item.thumbnail_url,
                apply_end_date: item.apply_end_date,
                updated_at: new Date()
            }
        });

        // Determine if snapshot needs updating
        const lastSnapshot = existing.snapshots[0];
        const hasDataChanged = !lastSnapshot ||
            lastSnapshot.recruit_count !== item.recruit_count ||
            lastSnapshot.applicant_count !== item.applicant_count;

        if (hasDataChanged) {
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
