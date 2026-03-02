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
} from "./_shared";

export class SeouloppaAdapter implements IPlatformAdapter {
  platformId = 5;
  baseUrl = "https://seouloppa.net";

  async fetchList(page: number): Promise<ScrapedCampaign[]> {
    console.log(`[Seouloppa] Page ${page}`);
    await sleep(1400 + Math.random() * 600);

    try {
      const { data } = await fetchWithRetry(`${this.baseUrl}/campaign/search?page=${page}`, {
        headers: { "User-Agent": "Mozilla/5.0 Chrome/121.0.0.0 Safari/537.36" },
      });
      const $ = cheerio.load(String(data || ""));
      const campaigns: ScrapedCampaign[] = [];

      $(".campaign-item, .box-item, [class*='campaign'], .item").each((i, el) => {
        if (i >= 20) return;
        const $el = $(el);
        const title = pickText($el.find(".title, h3, .subject").first());
        const href = $el.find("a[href]").first().attr("href") || "";
        if (!title || !href) return;

        const location = pickText($el.find(".local, .area, .location").first()) || "Seoul";
        const campaignText = pickText($el);
        const recruitText = /모집\s*([0-9,]+)/.exec(campaignText)?.[1];
        const applicantText = /신청\s*([0-9,]+)/.exec(campaignText)?.[1];
        const rewardText = pickText($el.find(".reward, .price").first()) || "보상 정보 없음";
        const ddayText = /D-?\s*(\d+)/i.exec(campaignText)?.[1];
        const dday = parseDdayDays(ddayText ? `D-${ddayText}` : undefined, DEFAULT_DDAY_DAYS);

        campaigns.push({
          original_id: `so_${href.split("/").filter(Boolean).pop() ?? `${Date.now()}_${i}`}`,
          title,
          campaign_type: /배송|샘플|선물|product|구매/.test(campaignText) ? "SHP" : "VST",
          media_type: /youtube|shorts|영상|영상촬영/.test(campaignText) ? "YP" : "BP",
          location,
          reward_text: rewardText,
          thumbnail_url: absoluteUrl(this.baseUrl, $el.find("img").first().attr("src") || ""),
          url: absoluteUrl(this.baseUrl, href),
          apply_end_date: buildDdayDate(dday),
          recruit_count: parseIntSafe(recruitText, DEFAULT_RECRUIT_COUNT),
          applicant_count: parseIntSafe(applicantText, DEFAULT_APPLICANT_COUNT),
          brief_desc: title.substring(0, 20) + " 외 보상혜택",
          tags: ["서울오빠", location].join(" "),
        });
      });

      return campaigns;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Seouloppa] Page ${page} failed:`, message);
      return [];
    }
  }
}

