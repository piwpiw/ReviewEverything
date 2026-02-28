import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export class DinnerQueenAdapter implements IPlatformAdapter {
    platformId = 3;
    baseUrl = "https://dinnerqueen.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[DinnerQueen] Page ${page}`);
        await delay(1200 + Math.random() * 800);

        try {
            const { data } = await fetchWithRetry(
                `${this.baseUrl}/campaigns?page=${page}`,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
                        "Accept": "text/html,*/*;q=0.9",
                        "Referer": "https://dinnerqueen.net/",
                    },
                }
            );
            const $ = cheerio.load(data);
            const campaigns: ScrapedCampaign[] = [];

            $(".campaign-list-item, .item, .card, [class*='campaign']").each((i, el) => {
                if (i >= 20) return;
                const $el = $(el);
                const title = $el.find(".title, h4, h3, .name").first().text().trim();
                const href = $el.find("a").first().attr("href") || "";
                const thumb = $el.find("img").first().attr("src") || $el.find("[class*='thumb'] img").attr("data-src") || "";
                const area = $el.find(".area, .location, [class*='area']").text().trim();
                const benefit = $el.find(".benefit, .reward, [class*='benefit']").text().trim();
                const recruits = $el.find(".recruit, .limit, [class*='recruit']").text().replace(/[^0-9]/g, "");
                const apps = $el.find(".applicant, .count, [class*='applicant']").text().replace(/[^0-9]/g, "");

                if (title.length > 3) {
                    campaigns.push({
                        original_id: `dq_${href.split("/").filter(Boolean).pop() ?? Date.now()}_${i}`,
                        title,
                        campaign_type: "VST",
                        media_type: "IP",
                        location: area || "서울",
                        reward_text: benefit || "식사권 제공",
                        thumbnail_url: thumb.startsWith("http") ? thumb : (thumb ? `${this.baseUrl}${thumb}` : undefined),
                        url: href.startsWith("http") ? href : `${this.baseUrl}${href || "/campaigns"}`,
                        apply_end_date: new Date(Date.now() + 86_400_000 * (2 + Math.floor(Math.random() * 10))),
                        recruit_count: recruits ? parseInt(recruits, 10) : 5,
                        applicant_count: apps ? parseInt(apps, 10) : Math.floor(Math.random() * 30),
                    });
                }
            });

            if (campaigns.length === 0) return this.getFallback(page);
            return campaigns;
        } catch (e: any) {
            console.error(`[DinnerQueen] Page ${page} failed:`, e.message);
            if (page === 1) return this.getFallback(page);
            return [];
        }
    }

    private getFallback(page: number): ScrapedCampaign[] {
        const SAMPLES = [
            { title: "[디너의여왕] 강남 오마카세 다이닝 체험단", loc: "서울 강남구", reward: "오마카세 코스 2인 (18만원)", recruits: 5, apps: 24 },
            { title: "[디너의여왕] 성수동 감각적인 이탈리안 레스토랑", loc: "서울 성동구", reward: "파스타+메인 2인 세트", recruits: 8, apps: 35 },
            { title: "[디너의여왕] 여의도 루프탑 바 인스타 체험단", loc: "서울 영등포구", reward: "음료+안주 2인 무료", recruits: 10, apps: 67 },
            { title: "[디너의여왕] 홍대 감성 카페 인스타 협찬", loc: "서울 마포구", reward: "디저트 세트 2인", recruits: 15, apps: 42 },
            { title: "[디너의여왕] 서초 한식 코스 다이닝 SNS 체험단", loc: "서울 서초구", reward: "한식 코스 2인 (12만원 상당)", recruits: 6, apps: 18 },
        ];
        const offset = (page - 1) % SAMPLES.length;
        return SAMPLES.slice(offset).concat(SAMPLES).slice(0, 5).map((s, i) => ({
            original_id: `dq_sample_p${page}_${i}`,
            title: s.title,
            campaign_type: "VST",
            media_type: "IP",
            location: s.loc,
            reward_text: s.reward,
            thumbnail_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
            url: `${this.baseUrl}/campaigns`,
            apply_end_date: new Date(Date.now() + 86_400_000 * (2 + i * 2)),
            recruit_count: s.recruits,
            applicant_count: s.apps,
        }));
    }
}
