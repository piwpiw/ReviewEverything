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
  parseDdayDays,
  pickText,
  sleep,
  normalizeText,
} from "./_shared";

const DQ_CARD_SELECTOR = ".qz-dq-card";

export class DinnerQueenAdapter implements IPlatformAdapter {
  platformId = 3;
  baseUrl = "https://dinnerqueen.net";

  async fetchList(page: number): Promise<ScrapedCampaign[]> {
    console.log(`[DinnerQueen] Page ${page}`);
    await sleep(1200 + Math.random() * 800);

    try {
      const { data } = await fetchWithRetry(
        `${this.baseUrl}/taste?page=${page}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/html,*/*;q=0.9",
            "Referer": "https://dinnerqueen.net/",
          },
        },
      );
      const $ = cheerio.load(String(data || ""));
      const campaigns: ScrapedCampaign[] = [];

      $(DQ_CARD_SELECTOR).each((i, el) => {
        if (i >= 30) return;
        const $el = $(el);
        const fullText = pickText($el);
        const rawTitle = $el.find("a").first().text().trim();
        const href = $el.find("a").first().attr("href") || "";

        const recruitText = /모집\s*([0-9,]+)/.exec(fullText)?.[1];
        const applicantText = /신청\s*([0-9,]+)/.exec(fullText)?.[1];
        const ddayText = /D-(\d+)/.exec(fullText)?.[1];
        const dday = parseDdayDays(ddayText ? `D-${ddayText}` : undefined, DEFAULT_DDAY_DAYS);

        const areaMatch = /\[([^\]]+)\]/.exec(fullText);
        const area = areaMatch ? areaMatch[1].trim() : "Seoul";

        const titleMatch = /\]\s*(.*?)\s*(?:D-\d+|\d+\s*일|신청)/.exec(fullText);
        const title = (
          titleMatch?.[1]?.trim()
          || rawTitle
          || fullText.split(" ").slice(2, 10).join(" ")
        ).trim();

        if (title.length < 3 || !href) return;

        const img = $el.find("img").first();
        const thumb = img.attr("src") || img.attr("data-src") || img.attr("data-srcset") || "";
        const recruitCount = parseIntSafe(recruitText, DEFAULT_RECRUIT_COUNT);
        const applicantCount = parseIntSafe(applicantText, DEFAULT_APPLICANT_COUNT);
        const textForMedia = normalizeText(fullText);

        campaigns.push({
          original_id: `dq_${href.split("/").filter(Boolean).pop() ?? `${Date.now()}_${i}`}`,
          title,
          campaign_type: textForMedia.includes("샘플") || textForMedia.includes("sample") ? "SHP" : "VST",
          media_type: /인스타|instagram|insta|유튜브|youtube|yt/.test(textForMedia) ? "IP" : "BP",
          location: area,
          reward_text: "보상 정보 없음",
          thumbnail_url: absoluteUrl(this.baseUrl, thumb),
          url: absoluteUrl(this.baseUrl, href),
          apply_end_date: buildDdayDate(dday),
          recruit_count: recruitCount,
          applicant_count: applicantCount,
          brief_desc: fullText.split(' ').slice(0, 5).join(' '),
          tags: [area, textForMedia.includes("방문") ? "방문형" : "배송형"].filter(Boolean).join(" "),
        });
      });

      return campaigns;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[DinnerQueen] Page ${page} failed:`, message);
      return [];
    }
  }
}

