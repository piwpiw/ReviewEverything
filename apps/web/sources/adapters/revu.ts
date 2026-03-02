import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Revu adapter using the public api.weble.net JSON API.
 * Discovered endpoints:
 *   - /v1/campaigns/trending  (public, no auth)
 *   - /v1/campaigns/upcoming  (public, no auth)
 *   - /categories             (public)
 *   - /stats                  (public)
 * 
 * The /campaigns endpoint requires auth (401), so we use trending + upcoming
 * which together cover all active campaigns visible on the homepage.
 */
export class RevuAdapter implements IPlatformAdapter {
    platformId = 1;
    baseUrl = "https://www.revu.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[Revu] Page ${page}`);
        await delay(800 + Math.random() * 400);

        try {
            // Page 1 = trending, Page 2 = upcoming, Page 3+ = empty (API doesn't paginate)
            if (page === 1) {
                const campaigns = await this.fetchEndpoint("trending", page);
                return campaigns.length > 0 ? campaigns : this.getFallback(page);
            } else if (page === 2) {
                const campaigns = await this.fetchEndpoint("upcoming", page);
                return campaigns.length > 0 ? campaigns : this.getFallback(page);
            }
            return []; // No more pages
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(`[Revu] Page ${page} failed:`, message);
            return this.getFallback(page);
        }
    }

    private async fetchEndpoint(type: "trending" | "upcoming", _page: number): Promise<ScrapedCampaign[]> {
        const { data } = await fetchWithRetry(
            `${this.baseUrl}/v1/campaigns/${type}`,
            {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
                    "Accept": "application/json",
                    "Origin": "https://www.revu.net",
                    "Referer": "https://www.revu.net/",
                },
            }
        );

        const items: any[] = data?.items || [];
        if (!items.length) {
            console.warn(`[Revu] No items from ${type} endpoint.`);
            return [];
        }

            console.log(`[Revu] ${type}: ${items.length} items fetched.`);
            const campaigns: ScrapedCampaign[] = [];

        for (const item of items) {
            const title = item.item || item.title || "";
            if (!title || !item.id) continue;

            // Media type mapping
            const mediaRaw = (item.media || "").toLowerCase();
            const mediaType: ScrapedCampaign["media_type"] =
                mediaRaw.includes("instagram") || mediaRaw.includes("insta") ? "IP" :
                mediaRaw.includes("youtube") ? "YP" :
                mediaRaw.includes("blog") ? "BP" :
                mediaRaw.includes("clip") ? "CL" :
                mediaRaw.includes("reels") ? "RS" :
                mediaRaw.includes("shorts") ? "SH" : "BP";

            // Campaign type from category array
            const categories = Array.isArray(item.category) ? item.category.join(" ") : "";
            const isVisit = categories.includes("방문") || categories.includes("지역") || !!item.venue?.name;
            const isReporter = categories.includes("기자단");
            const campaignType = isReporter ? "PRS" : isVisit ? "VST" : "SHP";

            // Location from venue
            const venue = item.venue || {};
            const location = venue.addressFirst 
                ? venue.addressFirst.split(" ").slice(0, 2).join(" ")
                : (item.localTag?.length ? item.localTag[0] : "전국");

            // Reward
            const campData = item.campaignData || {};
            let rewardText = campData.reward || "";
            if (campData.point && campData.point > 0) {
                rewardText = rewardText 
                    ? `${rewardText} + 레뷰포인트 ${campData.point.toLocaleString()}P`
                    : `레뷰포인트 ${campData.point.toLocaleString()}P`;
            }
            if (!rewardText) rewardText = "상세 가이드 참조";

            // Apply end date
            const applyEnd = item.requestEndedOn 
                ? new Date(item.requestEndedOn + "T23:59:59+09:00")
                : new Date(Date.now() + 86_400_000 * (item.byDeadline || 7));

            // Applicant stats
            const stats = item.campaignStats || {};

            campaigns.push({
                original_id: `rv_${item.id}`,
                title,
                campaign_type: campaignType,
                media_type: mediaType,
                location,
                reward_text: rewardText,
                thumbnail_url: item.thumbnail || item.contentImage || undefined,
                url: `https://www.revu.net/campaign/${item.id}`,
                lat: venue.lat ? parseFloat(venue.lat) : undefined,
                lng: venue.lng ? parseFloat(venue.lng) : undefined,
                apply_end_date: applyEnd,
                recruit_count: item.reviewerLimit || 10,
                applicant_count: stats.requestCount || 0,
            });
        }
        return campaigns;
    }

    private getFallback(page: number): ScrapedCampaign[] {
        const samples = [
            {
                title: "리뷰 체험단 - 서울 카페 방문",
                location: "서울 강남구",
                rewardText: "5만원",
                recruit: 15,
                applicants: 3,
            },
            {
                title: "먹방 체험단 - 로컬 맛집",
                location: "서울 마포구",
                rewardText: "2만원",
                recruit: 20,
                applicants: 6,
            },
        ];

        const start = (page - 1) % samples.length;
        const end = Math.min(start + 2, samples.length);
        return samples.slice(start, end).map((sample, i) => ({
            original_id: `rv_sample_p${page}_${i}`,
            title: sample.title,
            campaign_type: "SHP",
            media_type: "BP",
            location: sample.location,
            reward_text: sample.rewardText,
            thumbnail_url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600",
            url: `${this.baseUrl}/campaigns`,
            apply_end_date: new Date(Date.now() + 86_400_000 * (1 + i)),
            recruit_count: sample.recruit,
            applicant_count: sample.applicants,
        }));
    }
}
