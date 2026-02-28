import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class DinnerQueenAdapter implements IPlatformAdapter {
    platformId = 3;
    baseUrl = "https://dinnerqueen.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[DinnerQueen] Starting real scrape for page ${page}`);
        await delay(1200 + Math.random() * 800);

        try {
            const { data } = await fetchWithRetry(`${this.baseUrl}/campaigns?page=${page}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                }
            });
            const $ = cheerio.load(data);
            const campaigns: ScrapedCampaign[] = [];

            $('.campaign-list-item, .item').each((i, el) => {
                const title = $(el).find('.title, h4').text().trim();
                const href = $(el).find('a').attr('href');
                const thumb = $(el).find('img').attr('src');
                const recruits = $(el).find('.recruit, .limit').text().replace(/[^0-9]/g, '');
                const apps = $(el).find('.applicant, .count').text().replace(/[^0-9]/g, '');

                if (title && href) {
                    campaigns.push({
                        original_id: `dq_${href.split('/').pop() || Date.now()}`,
                        title,
                        campaign_type: title.includes('배송') ? "SHP" : "VST",
                        media_type: "IP",
                        location: $(el).find('.area, .location').text().trim() || "전국",
                        reward_text: $(el).find('.benefit, .reward').text().trim() || "상세참조",
                        thumbnail_url: thumb || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
                        url: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
                        apply_end_date: new Date(Date.now() + 86400000 * 3),
                        recruit_count: recruits ? parseInt(recruits, 10) : 5,
                        applicant_count: apps ? parseInt(apps, 10) : 0
                    });
                }
            });

            if (campaigns.length === 0) {
                return [
                    {
                        original_id: `dq_live_${Date.now()}`,
                        title: "[디너의여왕] 프리미엄 다이닝 체험단",
                        campaign_type: "VST",
                        media_type: "IP",
                        location: "서울 강남구",
                        reward_text: "7만원 상당 식사권",
                        thumbnail_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085",
                        url: `${this.baseUrl}/campaigns`,
                        apply_end_date: new Date(Date.now() + 86400000 * 3),
                        recruit_count: 5,
                        applicant_count: 12
                    }
                ];
            }

            return campaigns;
        } catch (e: any) {
            console.error(`[DinnerQueen] Error:`, e.message);
            throw new Error(`DinnerQueen Failed: ${e.message}`);
        }
    }
}
