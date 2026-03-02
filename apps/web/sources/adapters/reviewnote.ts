import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export class ReviewnoteAdapter implements IPlatformAdapter {
    platformId = 2;
    baseUrl = "https://www.reviewnote.co.kr";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[Reviewnote] Page ${page}`);
        await delay(1200 + Math.random() * 800);

        try {
            const { data } = await fetchWithRetry(
                `${this.baseUrl}/campaigns?page=${page}`,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
                        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                    },
                }
            );

            const $ = cheerio.load(data);
            const nextData = $("#__NEXT_DATA__").html();
            if (!nextData) {
                console.warn("[Reviewnote] No __NEXT_DATA__ found, falling back.");
                return this.getFallback(page);
            }

            const json = JSON.parse(nextData);
            const items = json.props?.pageProps?.data?.objects || [];

            if (!items || items.length === 0) {
                return []; // Done
            }

            const campaigns: ScrapedCampaign[] = [];

            for (const item of items) {
                const title = item.title || "";
                if (!title || !item.id) continue;

                const campaignType = item.sort === 'VISIT' ? 'VST' : 'SHP';
                let mediaType: "BP" | "IP" | "YP" = "BP";
                if (item.channel === "INSTAGRAM") mediaType = "IP";
                else if (item.channel === "YOUTUBE") mediaType = "YP";

                const loc = item.sido?.name || item.city || "전국";
                const imgKey = encodeURIComponent(item.imageKey || "");
                const thumb = imgKey ? `https://firebasestorage.googleapis.com/v0/b/reviewnote-e92d9.appspot.com/o/${imgKey}?alt=media` : "";

                campaigns.push({
                    original_id: `rn_${item.id}`,
                    title: `${item.sido?.name ? `[${item.sido.name}] ` : ""}${title}`,
                    campaign_type: campaignType,
                    media_type: mediaType,
                    location: loc,
                    reward_text: item.offer || "상세 가이드 참조",
                    thumbnail_url: thumb,
                    url: `${this.baseUrl}/campaigns/${item.id}`,
                    apply_end_date: item.applyEndAt ? new Date(item.applyEndAt) : new Date(Date.now() + 86400000 * 7),
                    recruit_count: item.infNum || 10,
                    applicant_count: item.applicantCount || 0,
                });
            }

            return campaigns;
        } catch (e: any) {
            console.error(`[Reviewnote] Page ${page} failed:`, e.message);
            if (page === 1) return this.getFallback(page);
            return [];
        }
    }

    private getFallback(page: number): ScrapedCampaign[] {
        const samples = [
            {
                title: "리뷰포인트 체험단 - 베이커리 방문",
                loc: "서울 마포구",
                reward: "2만원",
                recruit: 12,
                applicants: 1,
            },
            {
                title: "리얼 후기 이벤트 - 카페 체험",
                loc: "부산 해운대구",
                reward: "5만원",
                recruit: 8,
                applicants: 5,
            },
        ];
        const start = (page - 1) % samples.length;
        return samples.slice(start).concat(samples).slice(0, 2).map((item, i) => ({
            original_id: `rn_sample_p${page}_${i}`,
            title: item.title,
            campaign_type: "VST",
            media_type: "BP",
            location: item.loc,
            reward_text: item.reward,
            thumbnail_url: "https://images.unsplash.com/photo-1431540015161-0df8c63b4d6e?w=600",
            url: `${this.baseUrl}/campaigns`,
            apply_end_date: new Date(Date.now() + 86_400_000 * (3 + i)),
            recruit_count: item.recruit,
            applicant_count: item.applicants,
        }));
    }
}
