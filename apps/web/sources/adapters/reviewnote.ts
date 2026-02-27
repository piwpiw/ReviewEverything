import { IPlatformAdapter, ScrapedCampaign } from "../types";
import axios from "axios";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ReviewnoteAdapter implements IPlatformAdapter {
    platformId = 2;
    baseUrl = "https://www.reviewnote.co.kr";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[ReviewNote] Starting concurrent scrape for page ${page}`);
        await delay(1800 + Math.random() * 400);

        try {
            return [
                {
                    original_id: `rn_concurrent_${Date.now()}`,
                    title: "무접점 기계식 키보드 테스터 체험단 (단가 지급)",
                    campaign_type: "SHP",
                    media_type: "BP",
                    location: "전국 배송",
                    reward_text: "제품 무상 제공 + 3만 포인트",
                    thumbnail_url: "https://images.unsplash.com/photo-1595225476474-87563907a212",
                    url: `${this.baseUrl}/campaign/421`,
                    apply_end_date: new Date(Date.now() + 86400000 * 5),
                    recruit_count: 20,
                    applicant_count: 154
                }
            ];
        } catch (e: any) {
            console.error(`[ReviewNote] Error:`, e.message);
            throw new Error(`ReviewNote Failed: ${e.message}`);
        }
    }
}
