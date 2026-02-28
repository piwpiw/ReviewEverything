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
}

export interface IPlatformAdapter {
    platformId: number;
    baseUrl: string;
    fetchList(page: number): Promise<ScrapedCampaign[]>;
}
