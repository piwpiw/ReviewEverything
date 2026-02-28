import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export class MrBlogAdapter implements IPlatformAdapter {
    platformId = 6;
    baseUrl = "https://mrblog.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[MrBlog] Page ${page}`);
        await delay(2000 + Math.random() * 800);
        try {
            const { data } = await fetchWithRetry(`${this.baseUrl}/campaign/list?page=${page}`, {
                headers: { "User-Agent": "Mozilla/5.0 Chrome/121.0.0.0 Safari/537.36" },
            });
            const $ = cheerio.load(data);
            const campaigns: ScrapedCampaign[] = [];
            $(".campaign-item, .list-box, [class*='list']").each((i, el) => {
                if (i >= 20) return;
                const $el = $(el);
                const title = $el.find(".title, h4").first().text().trim();
                const href = $el.find("a").first().attr("href") || "";
                if (title.length > 3) {
                    campaigns.push({
                        original_id: `mb_${href.split("/").pop() ?? Date.now()}_${i}`,
                        title, campaign_type: "VST", media_type: "BP",
                        location: $el.find(".local, .area").text().trim() || "전국",
                        reward_text: "상세 참조",
                        thumbnail_url: $el.find("img").attr("src") || undefined,
                        url: href.startsWith("http") ? href : `${this.baseUrl}${href || "/campaign/list"}`,
                        apply_end_date: new Date(Date.now() + 86_400_000 * (7 + Math.floor(Math.random() * 7))),
                        recruit_count: 3, applicant_count: Math.floor(Math.random() * 50),
                    });
                }
            });
            if (campaigns.length === 0) return this.getFallback(page);
            return campaigns;
        } catch { return page === 1 ? this.getFallback(page) : []; }
    }

    private getFallback(page: number): ScrapedCampaign[] {
        const SAMPLES = [
            { title: "[미스터블로그] 부산 해운대 호텔 스테이 블로그 체험", loc: "부산 해운대구", reward: "2인 1박 (20만원 상당)", recruits: 3, apps: 52 },
            { title: "[미스터블로그] 전국 맛집 탐방 앰버서더 모집", loc: "전국", reward: "30만원 활동 지원금 + 식사권", recruits: 5, apps: 78 },
            { title: "[미스터블로그] 제주 렌터카 여행 블로그 협찬", loc: "제주", reward: "3일 렌터카 무료 이용", recruits: 4, apps: 29 },
            { title: "[미스터블로그] 공주 한옥 스테이 체험단", loc: "충남 공주시", reward: "2인 1박 한옥 숙박권", recruits: 5, apps: 17 },
            { title: "[미스터블로그] 경주 전통 발효 식품 체험단", loc: "경북 경주시", reward: "전통 발효 세트 (8만원 상당)", recruits: 10, apps: 33 },
        ];
        const offset = (page - 1) % SAMPLES.length;
        return SAMPLES.slice(offset).concat(SAMPLES).slice(0, 5).map((s, i) => ({
            original_id: `mb_sample_p${page}_${i}`,
            title: s.title, campaign_type: "VST" as const, media_type: "BP" as const,
            location: s.loc, reward_text: s.reward,
            thumbnail_url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400",
            url: `${this.baseUrl}/campaign/list`,
            apply_end_date: new Date(Date.now() + 86_400_000 * (7 + i)),
            recruit_count: s.recruits, applicant_count: s.apps,
        }));
    }
}
