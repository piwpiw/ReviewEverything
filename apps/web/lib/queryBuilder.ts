import { Prisma } from "@prisma/client";

export function buildCampaignsQuery(searchParams: URLSearchParams) {
    const q = searchParams.get('q');
    const platform_id = searchParams.get('platform_id');
    const campaign_type = searchParams.get('campaign_type');
    const media_type = searchParams.get('media_type');
    const category = searchParams.get('category');
    const sub_category = searchParams.get('sub_category');
    const region_depth1 = searchParams.get('region_depth1');
    const region_depth2 = searchParams.get('region_depth2');

    // Numeric Filters
    const min_reward = searchParams.get('min_reward');
    const max_comp = searchParams.get('max_comp');
    const dday_limit = searchParams.get('dday'); // e.g., 3 for D-3
    const max_deadline_days = searchParams.get('max_deadline_days'); // D-Day slider

    const sort = searchParams.get('sort') || 'latest_desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '24', 10);

    const where: Prisma.CampaignWhereInput = {};

    // ── Search Logic ──
    if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
            { reward_text: { contains: q, mode: 'insensitive' } },
        ];
    }

    // ── Filtering ──
    if (platform_id) where.platform_id = parseInt(platform_id, 10);
    if (campaign_type) where.campaign_type = campaign_type;

    // Multi-select Media support (comma separated)
    if (media_type) {
        if (media_type.includes(',')) {
            where.media_type = { in: media_type.split(',') };
        } else {
            where.media_type = media_type;
        }
    }

    if (category) where.category = category;
    if (sub_category) where.sub_category = sub_category;

    // Region Hierarchy
    if (region_depth1) where.region_depth1 = region_depth1;
    if (region_depth2) where.region_depth2 = region_depth2;

    // ── Numeric Ranges (Moaview High-End Feature) ──
    if (min_reward) {
        where.reward_value = { gte: parseInt(min_reward, 10) };
    }
    if (max_comp) {
        where.competition_rate = { lte: parseFloat(max_comp) };
    }
    // dday_limit: legacy param (exact days)
    if (dday_limit && !max_deadline_days) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + parseInt(dday_limit, 10));
        where.apply_end_date = { gte: new Date(), lte: targetDate };
    }
    // max_deadline_days: D-Day slider param (overrides dday_limit if both present)
    if (max_deadline_days) {
        const days = parseInt(max_deadline_days, 10);
        if (!isNaN(days) && days > 0) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() + days);
            where.apply_end_date = { gte: new Date(), lte: cutoff };
        }
    }

    // ── Sorting (Ultra-Fast Denormalized Columns) ──
    let orderBy: Prisma.CampaignOrderByWithRelationInput | Prisma.CampaignOrderByWithRelationInput[] = {
        created_at: 'desc'
    };

    switch (sort) {
        case 'deadline_asc':
            orderBy = [
                { apply_end_date: { sort: 'asc', nulls: 'last' } },
                { created_at: 'desc' }
            ];
            break;
        case 'competition_asc':
            orderBy = [
                { competition_rate: 'asc' },
                { created_at: 'desc' }
            ];
            break;
        case 'competition_desc':
            orderBy = [
                { competition_rate: 'desc' },
                { created_at: 'desc' }
            ];
            break;
        case 'applicant_desc':
            orderBy = { applicant_count: 'desc' };
            break;
        case 'reward_desc':
            orderBy = { reward_value: 'desc' };
            break;
        case 'latest_desc':
        default:
            orderBy = { created_at: 'desc' };
            break;
    }

    const skip = (page - 1) * limit;

    return { where, orderBy, skip, take: limit, page, limit, sort };
}
