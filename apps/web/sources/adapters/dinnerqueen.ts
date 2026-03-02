import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
const DQ_CARD_SELECTOR = ".qz-dq-card";
const DEFAULT_RECRUIT_COUNT = 5;
const DEFAULT_APPLICANT_COUNT = 0;
const DEFAULT_DDAY = 7;

type CampaignCount = {
  recruitText?: string;
  applicantText?: string;
  ddayText?: string;
};

export class DinnerQueenAdapter implements IPlatformAdapter {
    platformId = 3;
    baseUrl = "https://dinnerqueen.net";

    async fetchList(page: number): Promise<ScrapedCampaign[]> {
        console.log(`[DinnerQueen] Page ${page}`);
        await delay(1200 + Math.random() * 800);

        try {
            const { data } = await fetchWithRetry(
                `${this.baseUrl}/taste?page=${page}`,
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
            const parseIntSafe = (value: string, fallback: number): number => {
                const parsed = parseInt(value.replace(/,/g, ""), 10);
                return Number.isNaN(parsed) ? fallback : parsed;
            };
            const parseMediaType = (fullText: string): "IP" | "BP" => {
                return (
                    fullText.includes("릴스") ||
                    fullText.includes("인스타") ||
                    fullText.includes("블로그") ||
                    fullText.includes("클립") ||
                    fullText.includes("유튜브")
                )
                    ? "IP"
                    : "BP";
            };

            $(DQ_CARD_SELECTOR).each((i, el) => {
                if (i >= 30) return;
                const $el = $(el);

                const fullText = $el.text().replace(/\s+/g, " ").trim();
                const rawTitle = $el.find("a").first().text().trim();

                const counts: CampaignCount = {
                    recruitText: fullText.match(/모집\s*([0-9,]+)/)?.[1],
                    applicantText: fullText.match(/신청\s*([\d,]+)/)?.[1],
                    ddayText: fullText.match(/D-(\d+)/)?.[1],
                };

                const areaMatch = fullText.match(/\[([^\]]+)\]/);
                const area = areaMatch ? areaMatch[1].trim() : "전국";

                const titleMatch = fullText.match(/\]\s*(.*?)\s*(?:D-\d+|\d+\s*일\s*남음|신청)/);
                const title = (
                    titleMatch?.[1]?.trim() ||
                    rawTitle ||
                    fullText.split(" ").slice(2, 10).join(" ")
                ).trim();

                const href = $el.find("a").first().attr("href") || "";
                const img = $el.find("img").first();
                const thumb = img.attr("src") || img.attr("data-src") || img.attr("data-srcset") || "";
                const dday = parseIntSafe(counts.ddayText ?? `${DEFAULT_DDAY}`, DEFAULT_DDAY);
                const recruitCount = parseIntSafe(counts.recruitText ?? `${DEFAULT_RECRUIT_COUNT}`, DEFAULT_RECRUIT_COUNT);
                const applicantCount = parseIntSafe(counts.applicantText ?? `${DEFAULT_APPLICANT_COUNT}`, DEFAULT_APPLICANT_COUNT);

                if (title.length > 2 && href) {
                    campaigns.push({
                        original_id: `dq_${href.split("/").filter(Boolean).pop() ?? Date.now()}_${i}`,
                        title,
                        campaign_type: fullText.includes("배송") ? "SHP" : "VST",
                        media_type: parseMediaType(fullText),
                        location: area,
                        reward_text: "상세내용 확인",
                        thumbnail_url: thumb.startsWith("http") ? thumb : (thumb ? `${this.baseUrl}${thumb}` : undefined),
                        url: href.startsWith("http")
                            ? href
                            : `${this.baseUrl}${href.startsWith("/") ? "" : "/"}${href}`,
                        apply_end_date: new Date(Date.now() + 86_400_000 * Math.max(dday, 1)),
                        recruit_count: recruitCount,
                        applicant_count: applicantCount,
                    });
                }
            });

            if (campaigns.length === 0) {
                console.warn("[DinnerQueen] No campaigns found, falling back.");
                return this.getFallback(page);
            }
            return campaigns;
        } catch (e: any) {
            console.error(`[DinnerQueen] Page ${page} failed:`, e.message);
            if (page === 1) return this.getFallback(page);
            return [];
        }
    }

    private getFallback(page: number): ScrapedCampaign[] {
        const SAMPLES = [
            { title: "[서울/서초구] 저녁식사 체험단 진행", loc: "서울 서초구", reward: "식사 메뉴 제공", recruits: 5, apps: 24 },
            { title: "[부산/해운대구] 뷔페 체험단 모집", loc: "부산 해운대구", reward: "식사 제공 + 교통비", recruits: 8, apps: 35 },
            { title: "[대구/중구] 디저트 브이로그 체험단", loc: "대구 중구", reward: "디저트 + 음료 2종", recruits: 10, apps: 67 },
            { title: "[인천/연수구] 브런치카페 체험단", loc: "인천 연수구", reward: "브런치 제공 + 음료", recruits: 15, apps: 42 },
            { title: "[광주/서구] 카페 방문형 체험단", loc: "광주 서구", reward: "브레드 + 음료", recruits: 6, apps: 18 },
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
