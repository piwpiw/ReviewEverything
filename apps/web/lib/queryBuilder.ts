import { Prisma } from "@prisma/client";

export function buildCampaignsQuery(searchParams: URLSearchParams) {
    const q = searchParams.get('q');
    const platform_id = searchParams.get('platform_id');
    const campaign_type = searchParams.get('campaign_type');
    const media_type = searchParams.get('media_type');
    const sort = searchParams.get('sort') || 'latest_desc';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: Prisma.CampaignWhereInput = {};

    if (q) {
        where.OR = [
            { title: { contains: q, mode: 'insensitive' } },
            { location: { contains: q, mode: 'insensitive' } },
        ];
    }

    if (platform_id) {
        where.platform_id = parseInt(platform_id, 10);
    }

    if (campaign_type) {
        where.campaign_type = campaign_type;
    }

    if (media_type) {
        where.media_type = media_type;
    }

    let orderBy: Prisma.CampaignOrderByWithRelationInput | Prisma.CampaignOrderByWithRelationInput[] = {
        created_at: 'desc'
    };

    switch (sort) {
        case 'deadline_asc':
            orderBy = {
                apply_end_date: { sort: 'asc', nulls: 'last' }
            };
            break;
        case 'competition_asc':
            orderBy = {
                snapshots: {
                    _count: 'desc' // Sorting by relations without aggregates isn't direct in prisma, so we handle it uniquely 
                }
            };
            break;
        case 'latest_desc':
        default:
            orderBy = { created_at: 'desc' };
            break;
    }

    const skip = (page - 1) * limit;

    return { where, orderBy, skip, take: limit, page, limit };
}
