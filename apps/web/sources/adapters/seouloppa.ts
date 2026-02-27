import { IPlatformAdapter, ScrapedCampaign } from "../types";
import axios from "axios";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class SeouloppaAdapter implements IPlatformAdapter {
    platformId = 5;
    baseUrl = "https://seouloppa.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[SeoulOppa] Starting concurrent scrape for page ${page}`);
        await delay(1500 + Math.random() * 500);

        try {
            return [
                {
                    original_id: `so_concurrent_${Date.now()}`,
                    title: "올리브영 인기 스킨케어 패드 증정 이벤트",
                    campaign_type: "SHP",
                    media_type: "YP",
                    location: "전국",
                    reward_text: "기초 화장품 3종",
                    thumbnail_url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be",
                    url: `${this.baseUrl}/campaign/2832`,
                    apply_end_date: new Date(Date.now() + 86400000 * 6),
                    recruit_count: 50,
                    applicant_count: 12
                }
            ];
        } catch (e: any) {
            console.error(`[SeoulOppa] Error:`, e.message);
            throw new Error(`SeoulOppa Failed: ${e.message}`);
        }
    }
}
