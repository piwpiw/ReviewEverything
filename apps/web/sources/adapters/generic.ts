import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";
import {
    absoluteUrl,
    buildDdayDate,
    DEFAULT_APPLICANT_COUNT,
    DEFAULT_DDAY_DAYS,
    DEFAULT_RECRUIT_COUNT,
    parseIntSafe,
    normalizeText,
    sleep,
} from "./_shared";

export interface GenericSpec {
    platformId: number;
    baseUrl: string;
    listUrl: (page: number) => string;
    containerSelector: string;
    titleSelector: string;
    linkSelector: string;
    rewardSelector?: string;
    thumbnailSelector?: string;
    tagSelector?: string;
    recruitSelector?: string;
    applicantSelector?: string;
    locationSelector?: string;
    campaignTypeMarker?: (text: string) => ScrapedCampaign["campaign_type"];
    mediaTypeMarker?: (text: string) => ScrapedCampaign["media_type"];
}

export class GenericAdapter implements IPlatformAdapter {
    constructor(private spec: GenericSpec) { }

    get platformId() { return this.spec.platformId; }
    get baseUrl() { return this.spec.baseUrl; }

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[GenericAdapter:${this.spec.platformId}] Page ${page}`);
        await sleep(500 + Math.random() * 500);

        try {
            const { data } = await fetchWithRetry(this.spec.listUrl(page), {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
                },
            });

            const $ = cheerio.load(String(data || ""));
            const campaigns: ScrapedCampaign[] = [];

            $(this.spec.containerSelector).each((i, el) => {
                const $el = $(el);
                const title = normalizeText(this.spec.titleSelector ? $el.find(this.spec.titleSelector).text() : $el.text());
                const href = $el.find(this.spec.linkSelector).attr("href") || $el.attr("href") || "";
                if (!title || !href) return;

                const id = href.split("/").filter(Boolean).pop()?.split("?")[0] || `${Date.now()}_${i}`;
                const reward = this.spec.rewardSelector ? normalizeText($el.find(this.spec.rewardSelector).text()) : "";
                const thumb = this.spec.thumbnailSelector ? $el.find(this.spec.thumbnailSelector).attr("src") || $el.find(this.spec.thumbnailSelector).attr("data-src") : undefined;
                const tags = this.spec.tagSelector ? normalizeText($el.find(this.spec.tagSelector).text()) : "";
                const location = this.spec.locationSelector ? normalizeText($el.find(this.spec.locationSelector).text()) : "서울";

                const recruitCount = this.spec.recruitSelector ? parseIntSafe($el.find(this.spec.recruitSelector).text(), DEFAULT_RECRUIT_COUNT) : DEFAULT_RECRUIT_COUNT;
                const applicantCount = this.spec.applicantSelector ? parseIntSafe($el.find(this.spec.applicantSelector).text(), DEFAULT_APPLICANT_COUNT) : DEFAULT_APPLICANT_COUNT;

                const combinedText = `${title} ${reward} ${tags}`.toLowerCase();

                campaigns.push({
                    original_id: `gen_${this.spec.platformId}_${id}`,
                    title,
                    campaign_type: this.spec.campaignTypeMarker ? this.spec.campaignTypeMarker(combinedText) : (combinedText.includes("방문") ? "VST" : "SHP"),
                    media_type: this.spec.mediaTypeMarker ? this.spec.mediaTypeMarker(combinedText) : (combinedText.includes("인스타") ? "IP" : combinedText.includes("유튜브") ? "YP" : "BP"),
                    location: location || "서울",
                    reward_text: reward || "보상 정보 없음",
                    thumbnail_url: thumb ? absoluteUrl(this.baseUrl, thumb) : undefined,
                    url: absoluteUrl(this.baseUrl, href),
                    apply_end_date: buildDdayDate(DEFAULT_DDAY_DAYS),
                    recruit_count: recruitCount,
                    applicant_count: applicantCount,
                    brief_desc: reward.substring(0, 40),
                    tags: tags || "체험단",
                });
            });

            return campaigns;
        } catch (error: unknown) {
            console.error(`[GenericAdapter:${this.spec.platformId}] Error:`, error);
            return [];
        }
    }
}
