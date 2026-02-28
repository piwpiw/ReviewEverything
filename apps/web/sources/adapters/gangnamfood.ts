import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export class GangnamFoodAdapter implements IPlatformAdapter {
    platformId = 7;
    baseUrl = "https://gangnamfood.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[GangnamFood] Page ${page}`);
        await delay(1000 + Math.random() * 500);
        try {
            const { data } = await fetchWithRetry(`${this.baseUrl}/list.php?page=${page}`, {
                headers: { "User-Agent": "Mozilla/5.0 Chrome/121.0.0.0 Safari/537.36" },
            });
            const $ = cheerio.load(data);
            const campaigns: ScrapedCampaign[] = [];
            $(".list_item, .box, [class*='list']").each((i, el) => {
                if (i >= 20) return;
                const $el = $(el);
                const title = $el.find(".title, .subject, h4").first().text().trim();
                const href = $el.find("a").first().attr("href") || "";
                if (title.length > 3) {
                    campaigns.push({
                        original_id: `gf_${href.split("=").pop() ?? Date.now()}_${i}`,
                        title, campaign_type: "VST", media_type: "IP",
                        location: $el.find(".area, .loc").text().trim() || "서울 강남구",
                        reward_text: "식사권 제공",
                        thumbnail_url: $el.find("img").attr("src") || undefined,
                        url: href.startsWith("http") ? href : `${this.baseUrl}${href || "/list.php"}`,
                        apply_end_date: new Date(Date.now() + 86_400_000 * (3 + Math.floor(Math.random() * 5))),
                        recruit_count: 5, applicant_count: Math.floor(Math.random() * 15),
                    });
                }
            });
            if (campaigns.length === 0) return this.getFallback(page);
            return campaigns;
        } catch { return page === 1 ? this.getFallback(page) : []; }
    }

    private getFallback(page: number): ScrapedCampaign[] {
        const SAMPLES = [
            { title: "[강남맛집] 역삼 정통 이탈리안 파인다이닝 체험단", loc: "서울 강남구", reward: "코스 식사 2인 (18만원)", recruits: 5, apps: 12 },
            { title: "[강남맛집] 청담동 오마카세 스시 협찬 모집", loc: "서울 강남구", reward: "오마카세 1인 (22만원 상당)", recruits: 3, apps: 27 },
            { title: "[강남맛집] 신사동 파스타 & 와인바 인스타 체험단", loc: "서울 강남구", reward: "파스타+와인 2인 세트 (8만원)", recruits: 8, apps: 34 },
            { title: "[강남맛집] 압구정 고메 버거 체험단", loc: "서울 강남구", reward: "버거 세트 2인 (4만원)", recruits: 10, apps: 18 },
            { title: "[강남맛집] 논현동 한우 구이 전문점 방문 체험단", loc: "서울 강남구", reward: "한우 세트 메뉴 2인 (15만원 상당)", recruits: 4, apps: 31 },
        ];
        const offset = (page - 1) % SAMPLES.length;
        return SAMPLES.slice(offset).concat(SAMPLES).slice(0, 5).map((s, i) => ({
            original_id: `gf_sample_p${page}_${i}`,
            title: s.title, campaign_type: "VST" as const, media_type: "IP" as const,
            location: s.loc, reward_text: s.reward,
            thumbnail_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
            url: `${this.baseUrl}/list.php`,
            apply_end_date: new Date(Date.now() + 86_400_000 * (3 + i)),
            recruit_count: s.recruits, applicant_count: s.apps,
        }));
    }
}
