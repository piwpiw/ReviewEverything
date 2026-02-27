export interface ScrapedCampaign {
    original_id: string;
    title: string;
    campaign_type: 'VST' | 'SHP' | 'PRS';
    media_type: 'BP' | 'IP' | 'YP' | 'OTHER';
    location?: string;
    reward_text?: string;
    thumbnail_url?: string;
    url: string;
    apply_end_date: Date;
    recruit_count: number;
    applicant_count: number;
}

export interface IPlatformAdapter {
    platformId: number;
    baseUrl: string;
    fetchList(page: number): Promise<ScrapedCampaign[]>;
}
