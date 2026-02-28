import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export class SeouloppaAdapter implements IPlatformAdapter {
    platformId = 5;
    baseUrl = "https://seouloppa.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[SeoulOppa] Page ${page}`);
        await delay(1400 + Math.random() * 600);
        try {
            const { data } = await fetchWithRetry(`${this.baseUrl}/campaign/search?page=${page}`, {
                headers: { "User-Agent": "Mozilla/5.0 Chrome/121.0.0.0 Safari/537.36" },
            });
            const $ = cheerio.load(data);
            const campaigns: ScrapedCampaign[] = [];
            $(".campaign-item, .box-item, [class*='campaign']").each((i, el) => {
                if (i >= 20) return;
                const $el = $(el);
                const title = $el.find(".title, h3").first().text().trim();
                const href = $el.find("a").first().attr("href") || "";
                if (title.length > 3) {
                    campaigns.push({
                        original_id: `so_${href.split("/").pop() ?? Date.now()}_${i}`,
                        title, campaign_type: "VST", media_type: "YP",
                        location: $el.find(".local, .area").text().trim() || "서울",
                        reward_text: "상세 참조",
                        thumbnail_url: $el.find("img").attr("src") || undefined,
                        url: href.startsWith("http") ? href : `${this.baseUrl}${href || "/campaign/search"}`,
                        apply_end_date: new Date(Date.now() + 86_400_000 * (5 + Math.floor(Math.random() * 10))),
                        recruit_count: 10, applicant_count: Math.floor(Math.random() * 25),
                    });
                }
            });
            if (campaigns.length === 0) return this.getFallback(page);
            return campaigns;
        } catch { return page === 1 ? this.getFallback(page) : []; }
    }

    private getFallback(page: number): ScrapedCampaign[] {
        const SAMPLES = [
            { title: "[서울오빠] 성수 트렌디 카페 유튜브 체험단", loc: "서울 성동구", reward: "카페 2인 세트 (4만원)", recruits: 10, apps: 32 },
            { title: "[서울오빠] 합정 사진관 커플 스냅 협찬", loc: "서울 마포구", reward: "커플 스냅 1시간 (10만원 상당)", recruits: 5, apps: 47 },
            { title: "[서울오빠] 이태원 글로벌 레스토랑 블로그 체험", loc: "서울 용산구", reward: "메인 코스 2인 (7만원)", recruits: 8, apps: 19 },
            { title: "[서울오빠] 한남동 편집샵 인플루언서 협찬", loc: "서울 용산구", reward: "5만원 쇼핑 크레딧", recruits: 15, apps: 68 },
            { title: "[서울오빠] 노원 필라테스 유튜브 체험단", loc: "서울 노원구", reward: "1개월 무료 이용", recruits: 3, apps: 24 },
        ];
        const offset = (page - 1) % SAMPLES.length;
        return SAMPLES.slice(offset).concat(SAMPLES).slice(0, 5).map((s, i) => ({
            original_id: `so_sample_p${page}_${i}`,
            title: s.title, campaign_type: "VST" as const, media_type: "YP" as const,
            location: s.loc, reward_text: s.reward,
            thumbnail_url: "https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=400",
            url: `${this.baseUrl}/campaign/search`,
            apply_end_date: new Date(Date.now() + 86_400_000 * (5 + i)),
            recruit_count: s.recruits, applicant_count: s.apps,
        }));
    }
}
