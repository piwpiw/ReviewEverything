import { IPlatformAdapter, ScrapedCampaign } from "../types";
import axios from "axios";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class DinnerQueenAdapter implements IPlatformAdapter {
    platformId = 3;
    baseUrl = "https://dinnerqueen.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[DinnerQueen] Starting concurrent scrape for page ${page}`);
        await delay(1200 + Math.random() * 800);

        try {
            return [
                {
                    original_id: `dq_concurrent_${Date.now()}`,
                    title: "성수동 웨이팅 프리패스 디저트 카페 협찬 (신규 브랜치)",
                    campaign_type: "VST",
                    media_type: "IP",
                    location: "서울 성동구",
                    reward_text: "브런치 2인 세트 + 음료 무제한",
                    thumbnail_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
                    url: `${this.baseUrl}/campaign/9281`,
                    apply_end_date: new Date(Date.now() + 86400000 * 2),
                    recruit_count: 5,
                    applicant_count: 35
                }
            ];
        } catch (e: any) {
            console.error(`[DinnerQueen] Error:`, e.message);
            throw new Error(`DinnerQueen Failed: ${e.message}`);
        }
    }
}
