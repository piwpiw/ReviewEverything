import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * ReviewPlace adapter - scrapes reviewplace.co.kr/pr/
 * The campaign list is at /pr/ with pagination via ?page=N
 * Each item is .campaign_list .item with structured text data.
 */
export class ReviewPlaceAdapter implements IPlatformAdapter {
    platformId = 4;
    baseUrl = "https://www.reviewplace.co.kr";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[ReviewPlace] Page ${page}`);
        await delay(1500 + Math.random() * 500);
        try {
            const { data } = await fetchWithRetry(`${this.baseUrl}/pr/?page=${page}`, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
                    "Accept": "text/html,*/*;q=0.9",
                },
            });
            const $ = cheerio.load(data);
            const campaigns: ScrapedCampaign[] = [];

            $(".campaign_list .item").each((i, el) => {
                if (i >= 30) return;
                const $el = $(el);
                const fullText = $el.text().replace(/\s+/g, " ").trim();
                
                // Extract link and image
                const href = $el.find("a").first().attr("href") || "";
                const img = $el.find("img").first().attr("src") || "";

                // Parse title: remove tags like NEW, extract location+title
                // Format: "[지역] 타이틀...보상D - N신청 X / Y명"
                const titleMatch = fullText.match(/(?:NEW\s*)?((?:\[[^\]]+\]\s*)?[^D]+?)(?:D\s*-\s*\d|$)/);
                const title = titleMatch ? titleMatch[1].trim() : fullText.substring(0, 60);
                
                // Clean up reward text from title
                const rewardPatterns = /(\d[\d,]*원\s*(?:상당|이용권|제공)?|정가\s*[\d,]+원|[\d,]+원\s*이용권)/;
                const rewardMatch = fullText.match(rewardPatterns);
                const reward = rewardMatch ? rewardMatch[1] : "상세 참조";

                // Extract D-day
                const ddayMatch = fullText.match(/D\s*-\s*(\d+)/);
                const dday = ddayMatch ? parseInt(ddayMatch[1], 10) : 7;

                // Extract recruit/applicant: "신청 X / Y명"
                const countMatch = fullText.match(/신청\s*(\d+)\s*\/\s*(\d+)\s*명/);
                const applicantCount = countMatch ? parseInt(countMatch[1], 10) : 0;
                const recruitCount = countMatch ? parseInt(countMatch[2], 10) : 5;

                // Extract location from bracket
                const locMatch = title.match(/\[([^\]]+)\]/);
                const location = locMatch ? locMatch[1].replace(/\//g, " ") : "전국";

                // Campaign type
                const isVisit = fullText.includes("방문") || !!locMatch;
                const campaignType = fullText.includes("배송") ? "SHP" : isVisit ? "VST" : "SHP";

                // Media type
                const mediaType = fullText.includes("인스타") || fullText.includes("릴스") ? "IP" :
                    fullText.includes("유튜브") || fullText.includes("쇼츠") ? "YP" : "BP";

                // Extract ID from href
                const idMatch = href.match(/id=(\d+)/);
                const id = idMatch ? idMatch[1] : `${Date.now()}_${i}`;

                if (title.length > 3) {
                    campaigns.push({
                        original_id: `rp_${id}`,
                        title,
                        campaign_type: campaignType,
                        media_type: mediaType,
                        location,
                        reward_text: reward,
                        thumbnail_url: img.startsWith("http") ? img : (img ? `${this.baseUrl}${img}` : undefined),
                        url: href.startsWith("http") ? href : `${this.baseUrl}${href}`,
                        apply_end_date: new Date(Date.now() + 86_400_000 * Math.max(dday, 1)),
                        recruit_count: recruitCount,
                        applicant_count: applicantCount,
                    });
                }
            });

            if (campaigns.length === 0) {
                console.warn("[ReviewPlace] No campaigns found on page", page);
                return [];
            }
            return campaigns;
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.error(`[ReviewPlace] Page ${page} failed:`, message);
            return [];
        }
    }
}
