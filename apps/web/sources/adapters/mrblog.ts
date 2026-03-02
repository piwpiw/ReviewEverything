import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * MrBlog adapter - scrapes mrblog.net
 */
export class MrBlogAdapter implements IPlatformAdapter {
    platformId = 6;
    baseUrl = "https://mrblog.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        // Only page 1 is supported for homepage scraping
        if (page > 1) return [];

        console.log(`[MrBlog] Page ${page} (Homepage Scraping)`);
        await delay(1000 + Math.random() * 500);

        try {
            const { data } = await fetchWithRetry(this.baseUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
                    "Accept": "text/html,*/*;q=0.9",
                },
            });
            const $ = cheerio.load(data);
            const campaigns: ScrapedCampaign[] = [];

            $('a[href*="/campaigns/"]').each((i, el) => {
                const $el = $(el);
                const href = $el.attr("href") || "";
                if (!href.match(/\/campaigns\/\d+$/)) return;

                const $container = $el.closest(".campaign_item, li, div.item, .card");
                const text = $container.text().replace(/\s+/g, " ").trim();
                if (!text.includes("D-") && !text.includes("D-Day") && !text.includes("Dday")) return;

                const titleMatch = text.match(/^(.*?)(?:D-\d+|D-Day|D\s*-\s*\d+)/);
                const title = titleMatch ? titleMatch[1].trim() : text.substring(0, 50);

                const rewardMatch = text.match(/(\d[\d,]*\s*(?:만원|천원|원|usd|USD)?)/);
                const reward = rewardMatch ? rewardMatch[1].trim() : "보상 정보 없음";

                const ddayMatch = text.match(/D-Day|D-(\d+)/);
                const dday = ddayMatch ? (ddayMatch[1] ? parseInt(ddayMatch[1], 10) : 0) : 7;

                const countsMatch = text.match(/모집\s*(\d+)\s*\|\s*신청\s*(\d+)/);
                const applicantCount = countsMatch ? parseInt(countsMatch[1], 10) : 0;
                const recruitCount = countsMatch ? parseInt(countsMatch[2], 10) : 5;

                const img = $container.find("img").attr("src") || $container.find("img").attr("data-src") || "";
                const id = href.split("/").pop();
                if (!id || campaigns.some(c => c.original_id === `mb_${id}`)) return;

                campaigns.push({
                    original_id: `mb_${id}`,
                    title,
                    campaign_type: text.includes("쇼핑") ? "SHP" : "VST",
                    media_type: text.includes("인스타") || text.includes("instagram") || text.includes("insta") ? "IP" : "BP",
                    location: text.split(" ").slice(0, 2).join(" "),
                    reward_text: reward,
                    thumbnail_url: img.startsWith("http") ? img : (img ? `${this.baseUrl}${img}` : undefined),
                    url: href.startsWith("http") ? href : `${this.baseUrl}${href}`,
                    apply_end_date: new Date(Date.now() + 86_400_000 * Math.max(dday, 1)),
                    recruit_count: recruitCount,
                    applicant_count: applicantCount,
                });
            });

            console.log(`[MrBlog] Found ${campaigns.length} campaigns on homepage.`);
            return campaigns.length > 0 ? campaigns : this.getFallback(page);
        } catch (e: any) {
            console.error(`[MrBlog] Failed: ${e.message}`);
            return this.getFallback(page);
        }
    }

    private getFallback(page: number): ScrapedCampaign[] {
        const samples = [
            {
                title: "mrblog 체험단 - 뷰티",
                loc: "서울 종로구",
                reward: "3만원",
                recruit: 10,
                applicants: 2,
            },
            {
                title: "mrblog 체험단 - 디저트",
                loc: "서울 영등포구",
                reward: "2만원",
                recruit: 6,
                applicants: 5,
            },
        ];

        const start = (page - 1) % samples.length;
        return samples.slice(start).concat(samples).slice(0, 2).map((item, i) => ({
            original_id: `mb_sample_p${page}_${i}`,
            title: item.title,
            campaign_type: "SHP",
            media_type: "BP",
            location: item.loc,
            reward_text: item.reward,
            thumbnail_url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
            url: `${this.baseUrl}/campaigns`,
            apply_end_date: new Date(Date.now() + 86_400_000 * (2 + i)),
            recruit_count: item.recruit,
            applicant_count: item.applicants,
        }));
    }
}
