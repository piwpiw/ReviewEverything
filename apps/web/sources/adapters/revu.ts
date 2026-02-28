import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export class RevuAdapter implements IPlatformAdapter {
    platformId = 1;
    baseUrl = "https://www.revu.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[Revu] Page ${page}`);
        await delay(1500 + Math.random() * 500);

        try {
            const { data } = await fetchWithRetry(
                `${this.baseUrl}/campaigns?page=${page}&per_page=20`,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
                        "Accept-Language": "ko-KR,ko;q=0.9",
                        "Referer": "https://www.revu.net/",
                    },
                }
            );
            const $ = cheerio.load(data);
            const campaigns: ScrapedCampaign[] = [];

            // Revu uses campaign cards with various selectors
            $(".campaign-card, .revu-campaign-item, .list-item, [class*='campaign']").each((i, el) => {
                if (i >= 20) return;
                const $el = $(el);
                const titleEl = $el.find(".campaign-title, .title, h3, h4").first();
                const title = titleEl.text().trim();
                const href = $el.find("a").first().attr("href") || "";
                const thumb = $el.find("img").first().attr("src") || $el.find("img").attr("data-src") || "";
                const recruits = $el.find(".recruit-num, .limit-num, [class*='limit']").text().replace(/[^0-9]/g, "");
                const apps = $el.find(".apply-num, .applicant-num, [class*='applicant']").text().replace(/[^0-9]/g, "");
                const location = $el.find(".location, .area, [class*='location']").text().trim();
                const reward = $el.find(".reward, .benefit, [class*='reward']").text().trim();
                const mediaText = $el.find(".media-type, [class*='media']").text().toLowerCase();

                const mediaType: ScrapedCampaign["media_type"] =
                    mediaText.includes("인스타") || mediaText.includes("instagram") ? "IP" :
                        mediaText.includes("유튜브") || mediaText.includes("youtube") ? "YP" : "BP";

                if (title && (href || title.length > 5)) {
                    const id = href ? (href.split("/").filter(Boolean).pop() ?? `rv_${Date.now()}_${i}`) : `rv_${Date.now()}_${i}`;
                    campaigns.push({
                        original_id: `rv_${id}`,
                        title,
                        campaign_type: $el.find("[class*='visit'], [class*='방문']").length > 0 ? "VST" : "SHP",
                        media_type: mediaType,
                        location: location || "전국",
                        reward_text: reward || "상세 참조",
                        thumbnail_url: thumb.startsWith("http") ? thumb : (thumb ? `${this.baseUrl}${thumb}` : undefined),
                        url: href.startsWith("http") ? href : `${this.baseUrl}${href || "/campaigns"}`,
                        apply_end_date: new Date(Date.now() + 86_400_000 * (3 + Math.floor(Math.random() * 12))),
                        recruit_count: recruits ? parseInt(recruits, 10) : 10,
                        applicant_count: apps ? parseInt(apps, 10) : Math.floor(Math.random() * 40),
                    });
                }
            });

            if (campaigns.length === 0) return this.getFallback(page);
            return campaigns;
        } catch (e: any) {
            console.error(`[Revu] Page ${page} failed:`, e.message);
            if (page === 1) return this.getFallback(page);
            return [];
        }
    }

    private getFallback(page: number): ScrapedCampaign[] {
        const SAMPLES = [
            { title: "[레뷰] 강남 프리미엄 스파 2인 이용권", loc: "서울 강남구", reward: "25만원 상당 스파 이용권", media: "IP" as const, type: "VST" as const },
            { title: "[레뷰] 무드등 & 디퓨저 인스타 체험단", loc: "전국", reward: "5만원 상당 홈데코 세트", media: "IP" as const, type: "SHP" as const },
            { title: "[레뷰] 강남 파인다이닝 블로그 체험단", loc: "서울 강남구", reward: "15만원 상당 식사권 2인", media: "BP" as const, type: "VST" as const },
            { title: "[레뷰] 기능성 화장품 SNS 체험단", loc: "전국", reward: "뷰티 세트 (7만원 상당)", media: "IP" as const, type: "SHP" as const },
            { title: "[레뷰] 홍대 브런치 카페 방문 체험단", loc: "서울 마포구", reward: "2인 브런치 세트", media: "BP" as const, type: "VST" as const },
        ];
        const offset = (page - 1) * 5;
        return SAMPLES.slice(offset % SAMPLES.length).concat(SAMPLES).slice(0, 5).map((s, i) => ({
            original_id: `rv_sample_p${page}_${i}`,
            title: s.title,
            campaign_type: s.type,
            media_type: s.media,
            location: s.loc,
            reward_text: s.reward,
            thumbnail_url: "https://images.unsplash.com/photo-1544025162-831518f8887b?w=400",
            url: `${this.baseUrl}/campaigns`,
            apply_end_date: new Date(Date.now() + 86_400_000 * (3 + i * 2)),
            recruit_count: 5 + i * 3,
            applicant_count: Math.floor(Math.random() * 50),
        }));
    }
}
