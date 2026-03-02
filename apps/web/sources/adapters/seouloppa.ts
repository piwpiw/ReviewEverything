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

export class SeouloppaAdapter implements IPlatformAdapter {
  platformId = 5;
  baseUrl = "https://www.seoulouba.co.kr";
  listUrl = "/campaign/";

  async fetchList(page: number): Promise<ScrapedCampaign[]> {
    console.log(`[Seouloppa] Page ${page}`);
    await sleep(1400 + Math.random() * 600);

    try {
      const { data } = await fetchWithRetry(`${this.baseUrl}${this.listUrl}?page=${page}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
          "Referer": `${this.baseUrl}/campaign/`,
          "Upgrade-Insecure-Requests": "1",
        },
      });
      const $ = cheerio.load(String(data || ""));
      const campaigns: ScrapedCampaign[] = [];

      // SeoulOppa confirmed structure: .item or .cp_listbox li or similar
      const listItems = $(".item, .list_item, li.cp_item, .cp_listbox li");
      listItems.each((i, el) => {
        if (i >= 60) return;
        const $el = $(el);
        // Find title link that HAS text or a strong tag with text
        const titleLink = $el.find("a").filter((_, aEl) => $(aEl).find("strong").length > 0 || $(aEl).text().trim().length > 5).first();
        if (titleLink.length === 0) return;

        const titleText = titleLink.text().trim();
        const href = titleLink.attr("href") || "";
        if (!titleText || !href) return;

        const campaignText = pickText($el);
        const recruitText = $el.find(".total, .recruit").text().replace(/모집|\/| |인원/g, "").trim();
        const applicantText = $el.find(".apply, .request").text().replace(/신청| |인원/g, "").trim();
        const rewardText = $el.find(".txt, .reward, .benefit").text().trim() || $el.find(".point").text().trim() || "보상 정보 없음";
        const ddayText = $el.find(".dday, .time, .d_day").text().trim();
        const dday = parseDdayDays(ddayText, DEFAULT_DDAY_DAYS);

        campaigns.push({
          original_id: `so_${href.split("c=").pop() ?? href.split("/").filter(Boolean).pop() ?? `${Date.now()}_${i}`}`,
          title: normalizeText(titleText),
          campaign_type: /배송|샘플|선물|product|구매/.test(campaignText + rewardText) ? "SHP" : "VST",
          media_type: /youtube|shorts|영상|영상촬영/.test(campaignText) ? "YP" : "BP",
          location: titleText.match(/\[([^\]]+)\]/)?.[1] || "Seoul",
          reward_text: rewardText,
          thumbnail_url: absoluteUrl(this.baseUrl, $el.find("img").first().attr("src") || ""),
          url: absoluteUrl(this.baseUrl, href),
          apply_end_date: buildDdayDate(dday),
          recruit_count: parseIntSafe(recruitText, DEFAULT_RECRUIT_COUNT),
          applicant_count: parseIntSafe(applicantText, DEFAULT_APPLICANT_COUNT),
          brief_desc: titleText.substring(0, 20) + " 외 보상혜택",
          tags: ["서울오빠", titleText.match(/\[([^\]]+)\]/)?.[1] || "서울"].join(" "),
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
