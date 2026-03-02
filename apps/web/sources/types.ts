export interface ScrapedCampaign {
    original_id: string;
    title: string;
    campaign_type: string;
    media_type: string;
    location?: string;
    reward_text?: string;
    thumbnail_url?: string;
    url: string;
    shop_url?: string;
    lat?: number;
    lng?: number;
    apply_end_date: Date;
    recruit_count: number;
    applicant_count: number;
    brief_desc?: string;
    tags?: string;
}

export interface IPlatformAdapter {
    platformId: number;
    baseUrl: string;
    sourceKey?: string;
    supportsPagination?: boolean;
    maxPagesPerRun?: number;
    canRunInParallel?: boolean;
    fetchList(page: number): Promise<ScrapedCampaign[]>;
}
