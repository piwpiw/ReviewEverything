import { IPlatformAdapter, ScrapedCampaign } from "../types";
import { fetchWithRetry } from "../../lib/fetcher";
import * as cheerio from "cheerio";
import {
  absoluteUrl,
  buildDdayDate,
  DEFAULT_APPLICANT_COUNT,
  DEFAULT_DDAY_DAYS,
  DEFAULT_RECRUIT_COUNT,
  parseDdayDays,
  parseIntSafe,
  pickText,
  sleep,
  normalizeText,
} from "./_shared";

/**
 * MrBlog adapter - scrapes mrblog.net
 */
export class MrBlogAdapter implements IPlatformAdapter {
  platformId = 6;
  baseUrl = "https://mrblog.net";

  async fetchList(page: number): Promise<ScrapedCampaign[]> {
    if (page > 1) return [];

    console.log(`[MrBlog] Page ${page} (Homepage Scraping)`);
    await sleep(1000 + Math.random() * 500);

    try {
      const { data } = await fetchWithRetry(this.baseUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
          "Accept": "text/html,*/*;q=0.9",
        },
      });
      const $ = cheerio.load(String(data || ""));
      const campaigns: ScrapedCampaign[] = [];

      $('.campaign_item').each((i, el) => {
        const $el = $(el);
        const href = $el.attr("href") || "";
        if (!href) return;

        const title = normalizeText($el.find('strong').text());
        if (!title) return;

        const rewardText = normalizeText($el.find('p').text()) || "보상 정보 없음";
        const metaText = normalizeText($el.find('div span').text()); // location or tags

        const img = $el.find("img").first();
        const thumb = img.attr("src") || img.attr("data-src") || "";
        const id = href.split("/").filter(Boolean).pop();
        if (!id) return;

        campaigns.push({
          original_id: `mb_${id}`,
          title,
          campaign_type: rewardText.includes("쇼핑") || rewardText.includes("구매") ? "SHP" : "VST",
          media_type: metaText.includes("인스타") ? "IP" : "BP",
          location: metaText.split(" ").slice(0, 2).join(" "),
          reward_text: rewardText,
          thumbnail_url: absoluteUrl(this.baseUrl, thumb),
          url: absoluteUrl(this.baseUrl, href),
          apply_end_date: buildDdayDate(DEFAULT_DDAY_DAYS),
          recruit_count: DEFAULT_RECRUIT_COUNT,
          applicant_count: DEFAULT_APPLICANT_COUNT,
          brief_desc: rewardText.substring(0, 40),
          tags: ["MrBlog", metaText].join(" "),
        });
      });

      return campaigns;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[MrBlog] Failed: ${message}`);
      return [];
    }
  }
}

